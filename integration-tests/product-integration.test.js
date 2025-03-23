import { test, describe, expect, beforeAll, afterAll } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

describe("Testing Product Endpoint '/get-product/:slug'", () => {
    let mongoServer;

    const PRODUCTS = [
        {
            name: "Product 1",
            slug: "product-1",
            description: "This is product 1",
            price: 100,
            category: new mongoose.Types.ObjectId(),
            quantity: 10,
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

        await mongoose.connection.collection("products").insertMany(PRODUCTS);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        server.close();
    });

    test("should fetch a single product by slug", async () => {
        const response = await request(app).get(
            `/api/v1/product/get-product/${PRODUCTS[0].slug}`
        );

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

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Product not found");
    });
});

describe("Testing Product Endpoint '/update-product/:pid' and '/delete-product/:pid' and '/create-product'", () => {
    const USERS = {
        name: "CS 4218 Test Account",
        email: "cs4217@test.com",
        password:
            "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy",
        phone: "81234567",
        address: "1 Computing Drive",
        answer: "password is cs4218@test.com",
        role: 1,
        createdAt: "2025-02-04T13:40:46.071Z",
        updatedAt: "2025-02-04T13:40:46.071Z",
        __v: 0,
    };

    const CATEGORIES = [
        {
            name: "Category 1",
            slug: "category-1",
            description: "This is category 1",
            parentCategory: null,
        },
        {
            name: "Category 2",
            slug: "category-2",
            description: "This is category 2",
            parentCategory: null,
        },
    ];

    const PRODUCTS = [
        {
            name: "Product 1",
            slug: "product-1",
            description: "This is product 1",
            price: 100,
            category: new mongoose.Types.ObjectId(),
            quantity: 10,
            shipping: true,
        },
        {
            name: "Product 2",
            slug: "product-2",
            description: "This is product 2",
            price: 200,
            category: new mongoose.Types.ObjectId(),
            quantity: 20,
            shipping: true,
        },
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
        await mongoose.connection
            .collection("categories")
            .insertMany(CATEGORIES);
        await mongoose.connection.collection("products").insertMany(PRODUCTS);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoose.connection.close();
        server.close();
    });

    describe("Integration tests for authenticated user", () => {
        let token;

        beforeAll(async () => {
            const loginRes = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "cs4217@test.com",
                    password: "cs4218@test.com",
                });
            token = loginRes.body.token;
        });

        // UPDATE
        test("should update the price of an existing product", async () => {
            const productId = PRODUCTS[0]._id;
            const updatedPrice = 123;

            const response = await request(app)
                .put(`/api/v1/product/update-product/${productId}`)
                .set("Authorization", token)
                .field("name", PRODUCTS[0].name)
                .field("description", PRODUCTS[0].description)
                .field("price", updatedPrice)
                .field("category", PRODUCTS[0].category.toString())
                .field("quantity", PRODUCTS[0].quantity)
                .field("shipping", PRODUCTS[0].shipping.toString());

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Product updated successfully");
            expect(response.body.products).toBeDefined();
            expect(response.body.products.price).toBe(updatedPrice);

            const updatedProduct = await mongoose.connection
                .collection("products")
                .findOne({ _id: productId });
            expect(updatedProduct.price).toBe(updatedPrice);
        });

        test("should return 404 when attempting to update a non-existing product", async () => {
            const nonExistentProductId = new mongoose.Types.ObjectId();
            const updatedDetails = {
                name: "Product 1",
                description: "This is product 1",
                price: 99,
                category: new mongoose.Types.ObjectId(),
                quantity: 10,
                shipping: true,
            };

            const response = await request(app)
                .put(`/api/v1/product/update-product/${nonExistentProductId}`)
                .set("Authorization", token)
                .field("name", updatedDetails.name)
                .field("description", updatedDetails.description)
                .field("price", updatedDetails.price)
                .field("category", updatedDetails.category.toString())
                .field("quantity", updatedDetails.quantity)
                .field("shipping", updatedDetails.shipping.toString());

            expect(response.status).toBe(404);
            expect(response.body.error).toBe("Product not found");
        });

        test("should return 400 when attempting to update a product with invalid data (negative price)", async () => {
            const productId = PRODUCTS[0]._id;
            const invalidDetails = {
                name: "Product 1",
                description: "This is product 1",
                price: -100,
                category: PRODUCTS[0].category.toString(),
                quantity: 10,
                shipping: true,
            };

            const response = await request(app)
                .put(`/api/v1/product/update-product/${productId}`)
                .set("Authorization", token)
                .field("name", invalidDetails.name)
                .field("description", invalidDetails.description)
                .field("price", invalidDetails.price)
                .field("category", invalidDetails.category)
                .field("quantity", invalidDetails.quantity)
                .field("shipping", invalidDetails.shipping.toString());

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Price must be a positive number");
        });

        // DELETE
        test("should delete an existing product", async () => {
            const productId = PRODUCTS[1]._id;

            const response = await request(app)
                .delete(`/api/v1/product/delete-product/${productId}`)
                .set("Authorization", `Bearer ${token}`);

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
                .delete(
                    `/api/v1/product/delete-product/${nonExistentProductId}`
                )
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Product not found");
        });

        // CREATE
        test("should create a product with valid data and return 201 Created", async () => {
            const validProductData = {
                name: "New Product",
                description: "This is a new product",
                price: 99.99,
                category: CATEGORIES[0]._id.toString(),
                quantity: 10,
                shipping: true,
            };

            const response = await request(app)
                .post("/api/v1/product/create-product")
                .set("Authorization", token)
                .field("name", validProductData.name)
                .field("description", validProductData.description)
                .field("price", validProductData.price)
                .field("category", validProductData.category)
                .field("quantity", validProductData.quantity)
                .field("shipping", validProductData.shipping.toString());

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Product created successfully");
        });

        test("should return 400 when attempting to create a product with missing required fields", async () => {
            const invalidProductData = {
                quantity: 10,
                shipping: true,
            };

            const response = await request(app)
                .post("/api/v1/product/create-product")
                .set("Authorization", token)
                .field("quantity", invalidProductData.quantity)
                .field("shipping", invalidProductData.shipping.toString());

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Name is required");
        });

        test("should return 400 when attempting to create a product with invalid data (negative price)", async () => {
            const invalidProductData = {
                name: "Invalid Product",
                description: "This product has an invalid price",
                price: -100,
                category: CATEGORIES[0]._id.toString(),
                quantity: 10,
                shipping: true,
            };

            const response = await request(app)
                .post("/api/v1/product/create-product")
                .set("Authorization", token)
                .field("name", invalidProductData.name)
                .field("description", invalidProductData.description)
                .field("price", invalidProductData.price)
                .field("category", invalidProductData.category)
                .field("quantity", invalidProductData.quantity)
                .field("shipping", invalidProductData.shipping.toString());

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Price must be a positive number");
        });
    });
});
