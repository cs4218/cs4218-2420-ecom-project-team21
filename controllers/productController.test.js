import dotenv from "dotenv";
dotenv.config();

import { jest } from "@jest/globals";
import {
    getSingleProductController,
    createProductController,
    deleteProductController,
    updateProductController,
} from "./productController";
import productModel from "../models/productModel";
import fs from "fs";
import braintree from "braintree";

jest.mock("fs");
jest.mock("../models/productModel.js");
jest.mock("braintree", () => ({
    BraintreeGateway: jest.fn().mockImplementation(() => ({
        transaction: {
            sale: jest.fn(),
        },
    })),
    Environment: {
        Sandbox: "sandbox", // Mocking the environment value
        Production: "production", // You can add more as needed
    },
}));

describe("Product Controller Tests", () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
    });

    test("should initialize Braintree Gateway with real environment variables", () => {
        const gateway = new braintree.BraintreeGateway({
            environment: braintree.Environment.Sandbox,
            merchantId: process.env.BRAINTREE_MERCHANT_ID,
            publicKey: process.env.BRAINTREE_PUBLIC_KEY,
            privateKey: process.env.BRAINTREE_PRIVATE_KEY,
        });

        expect(gateway).toBeDefined();
        expect(gateway.transaction.sale).toBeDefined();
    });

    /* TEST CASES FOR GETTING SINGLE PRODUCT */
    describe("Get Single Product Controller Test", () => {
        beforeEach(() => {
            req = { params: { slug: "test-product" } };
        });

        // Valid Product ID: Should return product data when found
        test("should return product data when found", async () => {
            const mockProduct = {
                name: "Test Product",
                category: "Test Category",
            };

            productModel.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(mockProduct),
                }),
            });

            await getSingleProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Single Product Fetched",
                product: mockProduct,
            });
        });

        // Invalid Product ID: Should return 404 when product is not found
        test("should return 404 when product is not found", async () => {
            productModel.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(null),
                }),
            });

            await getSingleProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Product not found",
            });
        });

        // Missing Product ID: Should return 400 when slug is missing
        test("should return 400 when slug is missing", async () => {
            req.params = {}; // Simulating missing slug

            await getSingleProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Product ID is required",
            });
        });

        // Database/Server Error: Should return 500 error on failure
        test("should return 500 error on failure", async () => {
            productModel.findOne = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    populate: jest
                        .fn()
                        .mockRejectedValue(new Error("Database error")),
                }),
            });

            await getSingleProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while getting single product",
                error: expect.any(Error),
            });
        });
    });

    /* TEST CASES FOR CREATING PRODUCT */
    describe("Create Product Controller Test", () => {
        beforeEach(() => {
            req = {
                fields: {
                    name: "Test Product",
                    description: "Product description",
                    price: 100,
                    category: "Test Category",
                    quantity: 10,
                    shipping: "Shipping Info",
                },
                files: {
                    photo: {
                        size: 500000,
                        path: "mock/path/to/photo",
                        type: "image/jpeg",
                    },
                },
            };

            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };

            // Mock fs.readFileSync to return a mock buffer
            fs.readFileSync.mockReturnValue(Buffer.from("mocked photo data"));
        });

        // Successful Product Creation
        test("should create product successfully if all fields are valid", async () => {
            const mockProduct = {
                name: "Test Product",
                description: "Product description",
                price: 100,
                category: "Test Category",
                quantity: 10,
                shipping: "Shipping Info",
                photo: {
                    contentType: "image/jpeg",
                    data: Buffer.from("mocked photo data"), // Expecting mocked data
                },
                slug: "test-product", // Assuming slug is generated based on the name
            };

            // Mock the productModel's save method to return the mockProduct object
            productModel.prototype.save = jest
                .fn()
                .mockResolvedValue(mockProduct);

            // Initialize req and res
            req = {
                fields: {
                    name: "Test Product",
                    description: "Product description",
                    price: 100,
                    category: "Test Category",
                    quantity: 10,
                    shipping: "Shipping Info",
                },
                files: {
                    photo: {
                        size: 500000,
                        path: "mock/path/to/photo",
                        type: "image/jpeg",
                    },
                },
            };

            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };

            // Call the controller
            await createProductController(req, res);

            // Mock the expected response structure
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: "Product created successfully",
                    products: expect.objectContaining({
                        category: mockProduct.category,
                        description: mockProduct.description,
                        name: mockProduct.name,
                        photo: expect.objectContaining({
                            contentType: "image/jpeg",
                            data: expect.any(Buffer), // Expecting photo data as a Buffer
                        }),
                        price: mockProduct.price,
                        quantity: mockProduct.quantity,
                        shipping: mockProduct.shipping,
                        slug: mockProduct.slug, // Ensure that the slug is generated correctly
                    }),
                })
            );
        });

        // Missing Name: Should return error if name is missing
        test("should return error if name is missing", async () => {
            req.fields.name = ""; // Simulate missing name

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Name is required",
            });
        });

        // Missing Description: Should return error if description is missing
        test("should return error if description is missing", async () => {
            req.fields.description = ""; // Simulate missing description

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Description is required",
            });
        });

        // Missing Price: Should return error if price is missing
        test("should return error if price is missing", async () => {
            req.fields.price = ""; // Simulate missing price

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Price is required",
            });
        });

        // Invalid Price (NaN): Should return error if price is not a valid number
        test("should return error if price is not a valid number", async () => {
            req.fields.price = "abc"; // Simulate non-numeric price

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Price must be a valid number",
            });
        });

        // Negative Price: Should return error if price is negative
        test("should return error if price is negative", async () => {
            req.fields.price = -5; // Simulate negative price

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Price must be a positive number",
            });
        });

        // Missing Category: Should return error if category is missing
        test("should return error if category is missing", async () => {
            req.fields.category = ""; // Simulate missing category

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Category is required",
            });
        });

        // Missing Quantity: Should return error if quantity is missing
        test("should return error if quantity is missing", async () => {
            req.fields.quantity = ""; // Simulate missing quantity

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Quantity is required",
            });
        });

        // Invalid Quantity (NaN): Should return error if quantity is not a valid number
        test("should return error if quantity is not a valid number", async () => {
            req.fields.quantity = "xyz"; // Simulate non-numeric quantity

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Quantity must be a valid number",
            });
        });

        // Negative Quantity: Should return error if quantity is negative
        test("should return error if quantity is negative", async () => {
            req.fields.quantity = -10; // Simulate negative quantity

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Quantity must be a positive number",
            });
        });

        // Photo Size Exceeds 1MB: Should return error if photo size exceeds 1MB
        test("should return error if photo size exceeds 1MB", async () => {
            req.files.photo.size = 2000000; // Simulate photo size larger than 1MB

            await createProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Photo should be less than 1MB",
            });
        });

        // Database Error: Should return error if there is a failure while saving the product
        test("should return error if there is a failure while saving the product", async () => {
            // Simulate a database error by mocking products.save to throw an error
            const errorMessage = "Database error: Unable to save product.";
            jest.spyOn(productModel.prototype, "save").mockRejectedValue(
                new Error(errorMessage)
            );

            // Call the controller
            await createProductController(req, res);

            // Check that the correct error message and status code are sent
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.any(Error),
                    message: "Error in creating product",
                })
            );
        });
    });

    /* TEST CASES FOR DELETING PRODUCT */
    describe("Delete Product Controller Test", () => {
        let req, res;

        beforeEach(() => {
            jest.clearAllMocks();
            req = {
                params: {
                    pid: "validProductId", // Simulate a valid product ID
                },
            };

            res = {
                status: jest.fn().mockReturnThis(), // Mock status to return 'this' for chaining
                send: jest.fn(), // Mock send method
            };
        });

        // Successful Product Deletion
        test("should delete a product successfully", async () => {
            // Mock the findByIdAndDelete method to simulate successful deletion
            productModel.findByIdAndDelete = jest.fn().mockResolvedValue({
                _id: "validProductId",
                name: "Test Product",
            });

            await deleteProductController(req, res);

            // Assertions
            expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
                "validProductId"
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Product Deleted successfully",
            });
        });

        // Product Not Found
        test("should return 404 if product ID is invalid or does not exist", async () => {
            // Mock the findByIdAndDelete method to simulate no product found
            productModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);

            await deleteProductController(req, res);

            // Assertions
            expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
                "validProductId"
            );
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Product not found",
            });
        });

        // No product ID provided: should return 400 with appropriate message
        test("should return 400 if no product ID is provided", async () => {
            req = { params: {} }; // No product ID in request parameters

            await deleteProductController(req, res);

            // Check if response status and message are correct
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Product ID is required",
            });
        });

        // Database Error
        test("should return 500 if there is a database error", async () => {
            // Mock the findByIdAndDelete method to simulate a database error
            productModel.findByIdAndDelete = jest
                .fn()
                .mockRejectedValue(new Error("Database error"));

            await deleteProductController(req, res);

            expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
                "validProductId"
            );
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error while deleting product",
                error: expect.any(Error),
            });
        });
    });

    /* TEST CASES FOR UPDATING PRODUCT */
    describe("Update Product Controller Test", () => {
        let req;
        let res;

        beforeEach(() => {
            req = {
                fields: {
                    name: "Updated Product",
                    description: "Updated product description",
                    price: 150,
                    category: "Updated Category",
                    quantity: 20,
                    shipping: "Updated Shipping Info",
                },
                files: {
                    photo: {
                        size: 500000,
                        path: "mock/path/to/photo",
                        type: "image/jpeg",
                    },
                },
                params: {
                    id: "product-id-123", // Assuming you are using product ID to update
                },
            };

            res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };

            // Mock fs.readFileSync to return a mock buffer
            fs.readFileSync.mockReturnValue(Buffer.from("mocked photo data"));
        });

        // Successful Product Update
        test("should update product successfully", async () => {
            const mockProduct = {
                // Simulated product data to return
                _id: "123",
                name: "Updated Product",
                description: "Updated description",
                price: 100,
                category: "Updated Category",
                quantity: 10,
                shipping: "Fast",
                photo: {
                    data: null,
                    contentType: null,
                },
                save: jest.fn().mockResolvedValue(true), // Simulate save operation
            };

            productModel.findByIdAndUpdate.mockResolvedValue(mockProduct); // Mock successful DB update

            // Mocking fs.readFileSync to return dummy data (photo)
            fs.readFileSync.mockReturnValue(Buffer.from("photo data"));

            await updateProductController(req, res);

            // Assertions
            expect(res.status).toHaveBeenCalledWith(201); // Check if status 201 was set
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Product updated successfully",
                products: mockProduct, // Ensure the updated product is sent
            });
        });

        // Missing Name: Should return error if name is missing
        test("should return error if name is missing", async () => {
            req.fields.name = ""; // Simulate missing name

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Name is required",
            });
        });

        // Missing Description: Should return error if description is missing
        test("should return error if description is missing", async () => {
            req.fields.description = ""; // Simulate missing description

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Description is required",
            });
        });

        // Missing Price: Should return error if price is missing
        test("should return error if price is missing", async () => {
            req.fields.price = ""; // Simulate missing price

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Price is required",
            });
        });

        // Invalid Price (NaN): Should return error if price is not a valid number
        test("should return error if price is not a valid number", async () => {
            req.fields.price = "abc"; // Simulate non-numeric price

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Price must be a valid number",
            });
        });

        // Negative Price: Should return error if price is negative
        test("should return error if price is negative", async () => {
            req.fields.price = -5; // Simulate negative price

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Price must be a positive number",
            });
        });

        // Missing Category: Should return error if category is missing
        test("should return error if category is missing", async () => {
            req.fields.category = ""; // Simulate missing category

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Category is required",
            });
        });

        // Missing Quantity: Should return error if quantity is missing
        test("should return error if quantity is missing", async () => {
            req.fields.quantity = ""; // Simulate missing quantity

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Quantity is required",
            });
        });

        // Invalid Quantity (NaN): Should return error if quantity is not a valid number
        test("should return error if quantity is not a valid number", async () => {
            req.fields.quantity = "xyz"; // Simulate non-numeric quantity

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Quantity must be a valid number",
            });
        });

        // Negative Quantity: Should return error if quantity is negative
        test("should return error if quantity is negative", async () => {
            req.fields.quantity = -10; // Simulate negative quantity

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Quantity must be a positive number",
            });
        });

        // Photo Size Exceeds 1MB: Should return error if photo size exceeds 1MB
        test("should return error if photo size exceeds 1MB", async () => {
            req.files.photo.size = 2000000; // Simulate photo size larger than 1MB

            await updateProductController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                error: "Photo should be less than 1MB",
            });
        });

        // Product Not Found: Should return 404 if product is not found
        test("should return 404 if product is not found", async () => {
            // Mock findByIdAndUpdate to return null (indicating product not found)
            productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

            // Call the controller
            await updateProductController(req, res);

            // Check that the response contains a 404 error and the appropriate message
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                error: "Product not found",
            });
        });

        // Database Error: Should return error if there is a failure while updating the product
        test("should return error if there is a failure while updating the product", async () => {
            // Mock findByIdAndUpdate to return a mock product (ensures 404 is not triggered)
            const mockProduct = { name: "Test Product", price: 100 };
            productModel.findByIdAndUpdate = jest
                .fn()
                .mockResolvedValue(mockProduct);

            // Simulate a database error by mocking products.save to throw an error
            const errorMessage = "Database error: Unable to save product.";
            jest.spyOn(productModel.prototype, "save").mockRejectedValue(
                new Error(errorMessage)
            );

            // Mock the request and response objects
            const req = {
                params: { id: "123" }, // Simulate product ID in the request
                body: { name: "Updated Product", price: 150 }, // Simulate updated product data
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn().mockReturnThis(),
            };

            // Call the controller
            await updateProductController(req, res);

            // Check that the correct error message and status code are sent
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error in updating product",
                })
            );
        });
    });
});
