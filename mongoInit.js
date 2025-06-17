db = db.getSiblingDB('recart_webhook_db');


db.createCollection('partners');
db.createCollection('subscriptions');

const partners = [
  {
    name: "Awesome Reviews",
    webhookUrl: "https://httpbin.org/post",
    secretKey: "awesome-reviews-secret-123",
    apiKey: "$2b$10$1YkF7vCWhQpUiE4LRZ3C3uv7vcrZLbKGQIm5/nUlpAGdO.1eKZudm",
    isActive: true
  },
  {
    name: "Shopping Analytics",
    webhookUrl: "https://postman-echo.com/post",
    secretKey: "shopping-analytics-key-456",
    apiKey: "$2b$10$7nHOYH4D3a.GnH10x62Dw.o5OyAG19LRKMeaWMxwEBO1YdXJPK5m2",
    isActive: true
  },
  {
    name: "Inactive Partner",
    webhookUrl: "https://httpbin.org/status/429",
    secretKey: "inactive-partner-key-789",
    apiKey: "i$2b$10$YnCwBgjJ0KjsZF5GG1VgDu/2a.7G7xMh6e1i5yJT.liDf24Vn1EZi",
    isActive: false
  },
  {
    name: "Marketing Tools",
    webhookUrl: "https://httpbin.org/delay/1",
    secretKey: "marketing-tools-key-abc",
    apiKey: "$2b$10$AK7RKd1LKpBe8ZJ5zDJe4uL0Pfh/q4YoIXcQXcIXhXcSUBPDZDtK6",
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
