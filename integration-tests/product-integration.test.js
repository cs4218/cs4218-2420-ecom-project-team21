import { test, describe, expect, beforeAll, afterAll } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

describe("Testing Product Endpoint '/get-product/:slug'", () => {
    let mongoServer;

    const PRODUCTS = [
        {
            _id: new mongoose.Types.ObjectId(),
            name: "Textbook",
            slug: "textbook",
            description: "A comprehensive textbook",
            price: 79.99,
            category: new mongoose.Types.ObjectId(),
            quantity: 50,
            shipping: true,
        },
    ];

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        // console.log("Connected to MongoDB");

        await mongoose.connection.collection("products").insertMany(PRODUCTS);
        // console.log("Mock data inserted");

        const insertedProducts = await mongoose.connection
            .collection("products")
            .find()
            .toArray();
        // console.log("Inserted Products:", insertedProducts);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        server.close();
        // console.log("Disconnected from MongoDB");
    });

    test("should fetch a single product by slug", async () => {
        const response = await request(app).get(
            `/api/v1/product/get-product/${PRODUCTS[0].slug}`
        );
        // console.log("Response Body:", response.body);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Single Product Fetched");
        expect(response.body.product).toBeDefined();
        expect(response.body.product.slug).toBe(PRODUCTS[0].slug);
    });

    test("should return 404 if product is not found", async () => {
        const response = await request(app).get(
            `/api/v1/product/get-product/non-existent-slug`
        );
        // console.log("Response Body:", response.body);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Product not found");
    });
});

describe("Testing Product Endpoint '/delete-product/:pid'", () => {
    let mongoServer;
    let authToken;

    const PRODUCTS = [
        {
            _id: new mongoose.Types.ObjectId(),
            name: "Textbook",
            slug: "textbook",
            description: "A comprehensive textbook",
            price: 79.99,
            category: new mongoose.Types.ObjectId(),
            quantity: 50,
            shipping: true,
        },
    ];

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        // console.log("Connected to MongoDB");

        await mongoose.connection.collection("products").insertMany(PRODUCTS);
        // console.log("Mock data inserted");

        const loginResponse = await request(app)
            .post("/api/v1/auth/login")
            .send({
                email: "admin@example.com",
                password: "admin123",
            });
        authToken = loginResponse.body.token;
        // console.log("Admin token:", authToken);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        server.close();
        // console.log("Disconnected from MongoDB");
    });

    test("should delete an existing product", async () => {
        const productId = PRODUCTS[0]._id;

        const response = await request(app)
            .delete(`/api/v1/product/delete-product/${productId}`)
            .set("Authorization", `Bearer ${authToken}`);

        // console.log("Response Body:", response.body);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Product Deleted successfully");

        const deletedProduct = await mongoose.connection
            .collection("products")
            .findOne({ _id: productId });
        expect(deletedProduct).toBeNull();
    });

    test("should return 404 if product is not found", async () => {
        const nonExistentProductId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .delete(`/api/v1/product/delete-product/${nonExistentProductId}`)
            .set("Authorization", `Bearer ${authToken}`);

        // console.log("Response Body:", response.body);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Product not found");
    });
});
