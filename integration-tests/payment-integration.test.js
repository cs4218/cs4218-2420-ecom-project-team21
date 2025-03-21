import { test, describe } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";


describe("Testing Payment Gateway Endpoints '/braintree/token' and '/braintree/payment'", () => {
  let mongoServer;
  const USERS = 
    {
      name: "CS 4218 Test Account",
      email: "cs4219@test.com",
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
      name: "Product 1",
      slug: "product-1",
      description: "This is product 1",
      price: 100,
      category: new mongoose.Types.ObjectId(), // Use 'new' to correctly instantiate ObjectId
      quantity: 10,
      shipping: true
    },
    {
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
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri(), {dbName: "cs4218"});
      }
      await mongoose.connection.collection("users").deleteMany({});
      
      // Insert mock data into in-memory database
      await mongoose.connection.collection("users").insertOne(USERS);
      await mongoose.connection.collection("categories").insertMany(CATEGORIES);
      await mongoose.connection.collection("products").insertMany(PRODUCTS);
    });
  
    afterAll(async () => {
      await mongoose.disconnect();
    });

  describe("Integration tests for authenticated user", () => {
    let token;

    beforeAll(async () => {
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "cs4219@test.com", password: "cs4218@test.com" });
      token = loginRes.body.token;
    });

    test("should handle valid request for token", async () => {
      const response = await request(app).get(`/api/v1/product/braintree/token`).set("Authorization", token);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.clientToken).toBeDefined();
    });

    test("should handle valid request for payment", async () => {
      const response = await request(app)
        .post(`/api/v1/product/braintree/payment`)
        .set("Authorization", token)
        .send({
          nonce: "fake-valid-nonce",
          cart: [PRODUCTS[0]]
        });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    test("should handle missing nonce request for payment", async () => {
      const response = await request(app)
        .post(`/api/v1/product/braintree/payment`)
        .set("Authorization", token)
        .send({
          cart: [PRODUCTS[0]]
        });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Nonce is required");
    });

    test("should handle empty cart request for payment", async () => {
      const response = await request(app)
        .post(`/api/v1/product/braintree/payment`)
        .set("Authorization", token)
        .send({
          nonce: "fake-valid-nonce",
          cart: []
        });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Cart is Empty");
    });
  });
});
