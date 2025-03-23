import { test, describe, expect, beforeAll, afterAll } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

describe("Testing Category Endpoint '/get-category/:slug'", () => {
    let mongoServer;

    const CATEGORIES = [
        {
            name: "Category 1",
            slug: "category-1",
            description: "This is category 1",
        },
    ];

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        await mongoose.connection.collection("categories").insertMany(CATEGORIES);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
        server.close();
    });

    test("should fetch a single category by slug", async () => {
        const response = await request(app).get(
            `/api/v1/category/single-category/${CATEGORIES[0].slug}`
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Get Single Category Successfully");
        expect(response.body.category).toBeDefined();
        expect(response.body.category.slug).toBe(CATEGORIES[0].slug);
    });

    test("should handle non-existent category slug", async () => {
        const response = await request(app).get(
            `/api/v1/category/single-category/non-existent-slug`
        );

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.category).toBeNull();
    });
});

describe("Testing Category Endpoints '/update-category/:id', '/delete-category/:id', and '/create-category'", () => {
    const USERS = {
        name: "CS 4218 Test Account",
        email: "cs4217@test.com",
        password:
            "$2b$10$//wWsN./fEX1WiipH57HG.SAwgkYv1MRrPSkpXM38Dy5seOEhCoUy",
        phone: "81234567",
        address: "1 Computing Drive",
        answer: "password is cs4218@test.com",
        role: 1, // Admin role
        createdAt: "2025-02-04T13:40:46.071Z",
        updatedAt: "2025-02-04T13:40:46.071Z",
        __v: 0,
    };

    const CATEGORIES = [
        {
            name: "Category 1",
            slug: "category-1",
            description: "This is category 1",
        },
        {
            name: "Category 2",
            slug: "category-2",
            description: "This is category 2",
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
        await mongoose.connection.collection("categories").insertMany(CATEGORIES);
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

        test("should fetch all categories", async () => {
            const response = await request(app).get("/api/v1/category/get-category");

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("All Categories List");
            expect(response.body.category).toBeDefined();
            expect(Array.isArray(response.body.category)).toBe(true);
            expect(response.body.category.length).toBeGreaterThanOrEqual(2);
        });

        // CREATE
        test("should create a category with valid data and return 201 Created", async () => {
            const validCategoryData = {
                name: "New Category"
            };

            const response = await request(app)
                .post("/api/v1/category/create-category")
                .set("Authorization", token)
                .send(validCategoryData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("new category created");
            expect(response.body.category).toBeDefined();
            expect(response.body.category.name).toBe(validCategoryData.name);
            expect(response.body.category.slug).toBe("new-category");
        });

        test("should return 401 when attempting to create a category with missing name", async () => {
            const invalidCategoryData = {
                description: "This is an invalid category without a name"
            };

            const response = await request(app)
                .post("/api/v1/category/create-category")
                .set("Authorization", token)
                .send(invalidCategoryData);

            expect(response.status).toBe(401);
            expect(response.body.message).toBe("Name is required");
        });

        test("should return 200 when attempting to create a category that already exists", async () => {
            const existingCategoryData = {
                name: "Category 1"
            };

            const response = await request(app)
                .post("/api/v1/category/create-category")
                .set("Authorization", token)
                .send(existingCategoryData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Category Already Exists");
        });

        test("should update an existing category", async () => {
            const categoryId = CATEGORIES[0]._id;
            const updatedName = "Updated Category 1";

            const response = await request(app)
                .put(`/api/v1/category/update-category/${categoryId}`)
                .set("Authorization", token)
                .send({ name: updatedName });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Category Updated Successfully");
            expect(response.body.category).toBeDefined();
            expect(response.body.category.name).toBe(updatedName);
            expect(response.body.category.slug).toBe("updated-category-1");

            const updatedCategory = await mongoose.connection
                .collection("categories")
                .findOne({ _id: categoryId });
            expect(updatedCategory.name).toBe(updatedName);
        });

        test("should handle update of non-existent category", async () => {
            const nonExistentCategoryId = new mongoose.Types.ObjectId();
            const updatedName = "This Category Does Not Exist";

            const response = await request(app)
                .put(`/api/v1/category/update-category/${nonExistentCategoryId}`)
                .set("Authorization", token)
                .send({ name: updatedName });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.category).toBeNull();
        });

        test("should delete an existing category", async () => {
            const categoryId = CATEGORIES[1]._id;

            const response = await request(app)
                .delete(`/api/v1/category/delete-category/${categoryId}`)
                .set("Authorization", token);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Category Deleted Successfully");

            const deletedCategory = await mongoose.connection
                .collection("categories")
                .findOne({ _id: categoryId });
            expect(deletedCategory).toBeNull();
        });

        test("should handle deletion of non-existent category", async () => {
            const nonExistentCategoryId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/v1/category/delete-category/${nonExistentCategoryId}`)
                .set("Authorization", token);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Category Deleted Successfully");
        });

        test("should prevent unauthorized access to create category", async () => {
            const response = await request(app)
                .post("/api/v1/category/create-category")
                .send({ name: "Unauthorized Category" });

            expect(response.status).toBe(401);
        });

        test("should prevent unauthorized access to update category", async () => {
            const categoryId = CATEGORIES[0]._id;

            const response = await request(app)
                .put(`/api/v1/category/update-category/${categoryId}`)
                .send({ name: "Unauthorized Update" });

            expect(response.status).toBe(401);
        });

        test("should prevent unauthorized access to delete category", async () => {
            const categoryId = CATEGORIES[0]._id;

            const response = await request(app)
                .delete(`/api/v1/category/delete-category/${categoryId}`);

            expect(response.status).toBe(401);
        });
    });
});