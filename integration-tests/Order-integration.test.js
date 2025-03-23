import { test, describe } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

describe("Integration Tests - Order Endpoints '/braintree/token' and '/braintree/payment'", () => {
  let mongoServer;
  const ADMIN = {
        name: "admin@4218.sg",
        email: "admin@4218.sg",
        password: "$2b$10$o.ESH/gKZf5ObWT30ptltuVzkaex.AjfQO.ZWz0a7jAll29q7ieuC",
        phone: "admin@test.sg",
        address: "admin@test.sg",
        answer: "admin@test.sg",
        role: 1,
        createdAt: "2024-10-25T16:10:25.288Z",
        updatedAt: "2024-10-25T16:10:25.288Z",
        __v: 0,
    }
  
  const ORDERS = {
    _id: new mongoose.Types.ObjectId("67a21938cf4efddf1e5358d1"),
    products: [
      new mongoose.Types.ObjectId("66db427fdb0119d9234b27f3"),
      new mongoose.Types.ObjectId("66db427fdb0119d9234b27f3"),
      new mongoose.Types.ObjectId("66db427fdb0119d9234b27f3"),
    ],
    payment: {
      errors: {
        validationErrors: {},
        errorCollections: {
          transaction: {
            validationErrors: {
              amount: [
                {
                  attribute: "amount",
                  code: "81503",
                  message: "Amount is an invalid format.",
                },
              ],
            },
            errorCollections: {
              creditCard: {
                validationErrors: {
                  number: [
                    {
                      attribute: "number",
                      code: "81717",
                      message:
                        "Credit card number is not an accepted test number.",
                    },
                  ],
                },
              },
            },
          },
        },
      },
      params: {
        transaction: {
          amount: "3004.9700000000003",
          paymentMethodNonce: "tokencc_bh_c36kjx_t6mnd5_c2mzrt_7rdc6j_nb4",
          options: {
            submitForSettlement: "true",
          },
          type: "sale",
        },
      },
      message:
        "Amount is an invalid format.\nCredit card number is not an accepted test number.",
      success: false,
    },
    buyer: new mongoose.Types.ObjectId("67a218decf4efddf1e5358ac"),
    status: "Not Process",
    createdAt: "2025-02-04T13:42:16.741Z",
    updatedAt: "2025-02-04T13:42:16.741Z",
    __v: 0,
  };

  const USERS = 
    {
      _id: new mongoose.Types.ObjectId("67a218decf4efddf1e5358ac"),
      name: "CS 4218 Test Account",
      email: "cs4217@test.com",
      password: "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy",
      phone: "81234567",
      address: "1 Computing Drive",
      answer: "password is cs4218@test.com",
      role: 0,
      createdAt: "2025-02-04T13:40:46.071Z",
      updatedAt: "2025-02-04T13:40:46.071Z",
      __v: 0,
    };

  const CATEGORIES = [
    {
      name: "Category 1",
      slug: "category-1",
      description: "This is category 1",
      parentCategory: null
    },
    {
      name: "Category 2",
      slug: "category-2",
      description: "This is category 2",
      parentCategory: null
    }
  ];

  const PRODUCTS = [
    {
      _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f1"),
      name: "Product 1",
      slug: "product-1",
      description: "This is product 1",
      price: 100,
      category: new mongoose.Types.ObjectId(), // Use 'new' to correctly instantiate ObjectId
      quantity: 10,
      shipping: true
    },
    {
      _id: new mongoose.Types.ObjectId("66db427fdb0119d9234b27f3"),
      name: "Product 2",
      slug: "product-2",
      description: "This is product 2",
      price: 200,
      category: new mongoose.Types.ObjectId(), // Use 'new' to correctly instantiate ObjectId
      quantity: 20,
      shipping: true
    }
  ];

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
    await mongoose.connection.collection("users").insertOne(USERS);
    await mongoose.connection.collection("users").insertOne(ADMIN);
    await mongoose.connection.collection("orders").insertOne(ORDERS);
    await mongoose.connection.collection("categories").insertMany(CATEGORIES);
    await mongoose.connection.collection("products").insertMany(PRODUCTS);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoose.connection.close();
    server.close();
  });

  describe("Unauthorized Access Tests", () => {
    test("Should reject order retrieval for unauthenticated users", async () => {
      const response = await request(app).get("/api/v1/auth/orders");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("UnAuthorized Access");
    });

    test("Should reject all orders retrieval for unauthenticated users", async () => {
      const response = await request(app).get("/api/v1/auth/all-orders");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("UnAuthorized Access");
    });
  });

  describe("Authenticated User (Non-Admin) Tests", () => {
    let token;
    beforeAll(async () => {
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "cs4217@test.com", password: "cs4218@test.com" });
      token = loginRes.body.token;
    });

    test("Should allow authenticated user to retrieve their orders", async () => {
      const response = await request(app)
        .get("/api/v1/auth/orders")
        .set("Authorization", token);
      expect(response.status).toBe(200);
      expect(response.body[0].payment.message).toBe(ORDERS.payment.message);
    });

    test("Should prevent non-admin users from accessing all orders", async () => {
      const response = await request(app)
        .get("/api/v1/auth/all-orders")
        .set("Authorization", token);
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("UnAuthorized Access");
    });

    test("Should prevent non-admin users from updating order status", async () => {
      const response = await request(app)
        .put("/api/v1/auth/order-status/123")
        .set("Authorization", token);
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("UnAuthorized Access");
    });
  });

  describe("Admin User Tests", () => {
    let adminToken;
    beforeAll(async () => {
      const adminLoginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "admin@4218.sg", password: "admin@test.sg" });
      adminToken = adminLoginRes.body.token;
    });

    test("Should allow admin to update order status", async () => {
      const response = await request(app)
        .put(`/api/v1/auth/order-status/${ORDERS._id}`)
        .set("Authorization", adminToken)
        .send({ status: "Processed" });
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("Processed");
    });

    test("Should handle invalid order ID gracefully when updating status", async () => {
      const response = await request(app)
        .put("/api/v1/auth/order-status/1234")
        .set("Authorization", adminToken)
        .send({ status: "Processed" });
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error While Updating Order");
    });
  });

  
});
