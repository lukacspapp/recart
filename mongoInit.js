db = db.getSiblingDB('recart_webhook_db');


db.createCollection('partners');
db.createCollection('subscriptions');

const partners = [
  {
    name: "Awesome Reviews",
    webhookUrl: "https://httpbin.org/post",
    secretKey: "awesome-reviews-secret-123",
    apiKey: "awesome-reviews-api-key-123",
    isActive: true
  },
  {
    name: "Shopping Analytics",
    webhookUrl: "https://postman-echo.com/post",
    secretKey: "shopping-analytics-key-456",
    apiKey: "shopping-analytics-api-key-456",
    isActive: true
  },
  {
    name: "Inactive Partner",
    webhookUrl: "https://httpbin.org/status/429",
    secretKey: "inactive-partner-key-789",
    apiKey: "inactive-partner-api-key-789",
    isActive: false
  },
  {
    name: "Marketing Tools",
    webhookUrl: "https://httpbin.org/delay/1",
    secretKey: "marketing-tools-key-abc",
    apiKey: "marketing-tools-api-key-abc",
    isActive: true
  }
];

db.partners.insertMany(partners);

const awesomeReviews = db.partners.findOne({ name: "Awesome Reviews" });
const shoppingAnalytics = db.partners.findOne({ name: "Shopping Analytics" });
const inactivePartner = db.partners.findOne({ name: "Inactive Partner" });
const marketingTools = db.partners.findOne({ name: "Marketing Tools" });

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
