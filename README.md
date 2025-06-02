# Recart Webhook Notification Service

A scalable webhook notification service that allows partners to subscribe to events and receive real-time notifications when events occur.

## Overview

This service enables:
- Triggering different types of events (e.g., `order.created`, `customer.created`)
- Dynamically determining which partners should receive notifications based on subscriptions
- Delivering webhook payloads to partner endpoints with retry capabilities
- Securing webhook deliveries with HMAC signatures

## Architecture

The system consists of two main components:

1. **API Server**: Receives event requests, validates them, and queues them for processing
2. **Worker**: Processes queued events, matches them with subscribed partners, and delivers webhooks

### Technology Stack

- **Node.js** with **TypeScript** for type safety
- **Express** for API endpoints
- **BullMQ** for job queue management
- **Redis** for job persistence
- **MongoDB** for partner data storage
- **Axios** for HTTP requests to partner endpoints

## Technical Implementation

### Event Flow

1. Events are submitted as a batch to `/api/v1/events`
2. Each event is validated and added to a BullMQ queue
3. The worker picks up events and:
   - Identifies subscribed partners
   - Creates webhook payloads with signatures
   - Delivers to partner endpoints
   - Handles retries for failures

### Key Features

#### Security
- Each partner has a unique secret key
- Webhook payloads are signed using HMAC-SHA256
- Signatures are included in request headers for verification

#### Reliability
- Failed webhook deliveries are automatically retried
- Exponential backoff strategy for retries
- Failed jobs are persisted for troubleshooting

#### Scalability
- Separated API and worker processes allow independent scaling
- BullMQ provides efficient job distribution
- Configurable concurrency settings

## Setup Instructions

### Docker Setup

Create a `.env` file with the following variables:

```env
PORT=3000
MONGO_URI=mongodb://mongo:27017/recart_webhook_db
REDIS_URL=redis://redis:6379
WEBHOOK_MAX_ATTEMPTS=3
WEBHOOK_RETRY_DELAY=2500
WEBHOOK_TIMEOUT=5000
WORKER_CONCURRENCY=5
BATCH_SIZE=100
MONGO_INITDB_DATABASE=recart_webhook_db
```

Then run:

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d
```

## Testing the API

### Postman Collection

A Postman collection (`postman_collection.json`) is included in the repository. You can import this file into Postman to quickly test the API endpoints.

### API Endpoints

#### Submit Events

**Endpoint:** `POST /api/v1/events`

**Request Example:**

```json
[
  {
    "eventType": "order.created",
    "data": {
      "orderId": "ord_12345",
      "value": 99.99
    }
  },
  {
    "eventType": "order.fulfilled",
    "data": {
      "orderId": "ord_12345",
      "value": 99.99
    }
  },
  {
    "eventType": "customer.created",
    "data": {
      "orderId": "cust_67890",
      "value": 0
    }
  }
]
```

**Response Example:**

#### Successful Response (202 Accepted):

```json
{
  "message": "All 3 events successfully enqueued",
  "results": [
    {
      "eventId": "event_1a2b3c4d5e6f",
      "eventType": "order.created",
      "status": "success"
    },
    {
      "eventId": "event_7g8h9i0j1k2l",
      "eventType": "order.fulfilled",
      "status": "success"
    },
    {
      "eventId": "event_3m4n5o6p7q8r",
      "eventType": "customer.created",
      "status": "success"
    }
  ]
}
```

#### Partial Success Response (207 Multi-Status):
```json
{
  "message": "Some events failed to enqueue: Queue connection error",
  "results": [
    {
      "eventId": "event_1a2b3c4d5e6f",
      "eventType": "order.created",
      "status": "failed",
      "error": "Queue connection error"
    },
    {
      "eventId": "event_7g8h9i0j1k2l",
      "eventType": "order.fulfilled",
      "status": "failed",
      "error": "Queue connection error"
    }
  ]
}
```

#### Validation Error Response (400 Bad Request):
```json
{
  "error": "Invalid request body. Errors: data.eventType: Expected string, received number"
}
```

#### Server Error Response (500 Internal Server Error):
```json
{
  "error": "Internal server error"
}
```


## Design Decisions

### Queue-Based Architecture
I chose a queue-based architecture to decouple event receipt from processing, which:
- Prevents failures in partner systems from affecting our API response times
- Allows for independent scaling of the API and worker components
- Provides built-in retry capabilities and job persistence

### Batch Processing
The API accepts batches of events to improve efficiency when multiple events need to be processed together. This approach:
- Reduces network overhead when submitting multiple events
- Enables atomic validation of related events
- Provides consolidated response for event submissions

### Atomic Batch Error Handling
I implemented an atomic approach where all events in a batch either succeed or fail together:
- Ensures data consistency with no partial updates
- Simplifies client retry logic (retry the entire batch)
- Provides clear and consistent error reporting
- Maintains transactional integrity treating batches as units of work

### Security

#### Outgoing Webhook Security
Each partner has a unique secret key used to sign webhook payloads, allowing partners to verify that requests came from our system:
- HMAC-SHA256 signatures prevent tampering with webhook data
- Signatures are included in request headers (`X-Recart-Signature-256`)
- Partners can verify the signature using their stored secret key

#### Incoming API Security
API requests to our system are secured with API key authentication:
- Partners must include their API key in the `X-API-Key` header
- The system validates the key against the partner's stored secret key
- Requests without valid API keys are rejected with 401 Unauthorized
- Only active partners with valid credentials can trigger webhook events

### Type Safety
TypeScript with TypeBox validation ensures proper data structures throughout the system:
- Runtime validation of all API inputs
- Compile-time type checking across the codebase
- Self-documenting API contracts with clear error messages

