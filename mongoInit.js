db = db.getSiblingDB('recart_webhook_db');


db.createCollection('partners');
db.createCollection('subscriptions');

const partners = [
  {
    name: "Awesome Reviews",
    webhookUrl: "https://httpbin.org/post", // Returns 200 OK with request details
    secretKey: "awesome-reviews-secret-123",
    isActive: true
  },
  {
    name: "Shopping Analytics",
    webhookUrl: "https://postman-echo.com/post", // Different service, also returns request details
    secretKey: "shopping-analytics-key-456",
    isActive: true
  },
  {
    name: "Inactive Partner",
    webhookUrl: "https://httpbin.org/status/429", // Will always return 429 Too Many Requests (good for testing error handling)
    secretKey: "inactive-partner-key-789",
    isActive: false
  },
  {
    name: "Marketing Tools",
    webhookUrl: "https://httpbin.org/delay/1", // 1 second delay (good for testing timeouts)
    secretKey: "marketing-tools-key-abc",
    isActive: true
  }
];

db.partners.insertMany(partners);

// Get the ObjectIds of inserted partners
const awesomeReviews = db.partners.findOne({ name: "Awesome Reviews" });
const shoppingAnalytics = db.partners.findOne({ name: "Shopping Analytics" });
const inactivePartner = db.partners.findOne({ name: "Inactive Partner" });
const marketingTools = db.partners.findOne({ name: "Marketing Tools" });

// Insert subscription data
const subscriptions = [
  {
    partnerId: awesomeReviews._id,
    eventType: "order.created",
    isActive: true
  },
  {
    partnerId: awesomeReviews._id,
    eventType: "order.fulfilled",
    isActive: true
  },
  {
    partnerId: shoppingAnalytics._id,
    eventType: "order.created",
    isActive: true
  },
  {
    partnerId: inactivePartner._id,
    eventType: "order.created",
    isActive: true
  },
  {
    partnerId: marketingTools._id,
    eventType: "order.created",
    isActive: false
  },
  {
    partnerId: marketingTools._id,
    eventType: "customer.created",
    isActive: true
  }
];

db.subscriptions.insertMany(subscriptions);

print("-----------------------------------MongoDB initialization completed. Test data loaded successfully.-----------------------------");
