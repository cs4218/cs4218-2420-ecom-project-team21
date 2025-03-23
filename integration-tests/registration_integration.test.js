import { test, describe, expect, beforeAll, afterAll } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
  server.close();
});

describe("User Registration API Tests", () => {
  test("should successfully register a new user", async () => {
    const userData = {
      name: "Test User",
      email: "test@example.com",
      password: "Pass123!",
      phone: "123-456-7890",
      address: "Test Address 123",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("User Register Successfully");
    expect(response.body.user).toBeDefined();
    expect(response.body.user.name).toBe(userData.name);
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user.password).not.toBe(userData.password);
  });

  test("should return error when required fields are missing", async () => {
    const incompleteUserData = {
      name: "Test User",
      password: "Pass123!",
      phone: "123-456-7890",
      address: "Test Address",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(incompleteUserData);

    expect(response.body.success).toBeFalsy();
    expect(response.body.message).toBe("Email is Required");
  });

  test("should prevent registration with an existing email", async () => {
    const existingUserData = {
      name: "Existing User",
      email: "test@example.com", 
      password: "Pass123!",
      phone: "123-456-7890",
      address: "Test Address",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(existingUserData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Already Register please login");
  });

  test("should validate email format", async () => {
    const invalidEmailData = {
      name: "Test User",
      email: "invalid-email", 
      password: "Pass123!",
      phone: "123-456-7890",
      address: "Test Address",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(invalidEmailData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid Email");
  });

  test("should validate password strength", async () => {
    const weakPasswordData = {
      name: "Test User",
      email: "test2@example.com",
      password: "weak", 
      phone: "123-456-7890",
      address: "Test Address",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(weakPasswordData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid password");
  });

  test("should validate phone number format", async () => {
    const invalidPhoneData = {
      name: "Test User",
      email: "test2@example.com",
      password: "Pass123!",
      phone: "invalid-phone", 
      address: "Test Address",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(invalidPhoneData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid Phone Number");
  });

  test("should return error when name is missing", async () => {
    const missingNameData = {
      email: "test3@example.com",
      password: "Pass123!",
      phone: "123-456-7890",
      address: "Test Address",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(missingNameData);

    expect(response.body.error).toBe("Name is Required");
  });

  test("should return error when password is missing", async () => {
    const missingPasswordData = {
      name: "Test User",
      email: "test3@example.com",
      phone: "123-456-7890",
      address: "Test Address",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(missingPasswordData);

    expect(response.body.message).toBe("Password is Required");
  });

  test("should return error when phone is missing", async () => {
    const missingPhoneData = {
      name: "Test User",
      email: "test3@example.com",
      password: "Pass123!",
      address: "Test Address",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(missingPhoneData);

    expect(response.body.message).toBe("Phone no is Required");
  });

  test("should return error when address is missing", async () => {
    const missingAddressData = {
      name: "Test User",
      email: "test3@example.com",
      password: "Pass123!",
      phone: "123-456-7890",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(missingAddressData);

    expect(response.body.message).toBe("Address is Required");
  });

  test("should return error when answer is missing", async () => {
    const missingAnswerData = {
      name: "Test User",
      email: "test3@example.com",
      password: "Pass123!",
      phone: "123-456-7890",
      address: "Test Address"
    };

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(missingAnswerData);

    expect(response.body.message).toBe("Answer is Required");
  });

  test("should handle server errors during registration", async () => {

    const originalFindOne = mongoose.Model.findOne;
    const originalSave = mongoose.Model.prototype.save;
    
    try {
      mongoose.Model.findOne = jest.fn().mockResolvedValue(null);
      mongoose.Model.prototype.save = jest.fn().mockRejectedValue(new Error("Database error"));
      
      const userData = {
        name: "Error Test User",
        email: "error@example.com",
        password: "Pass123!",
        phone: "123-456-7890",
        address: "Test Address",
        answer: "Football"
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(userData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in Registeration");
      expect(response.body.error).toBeDefined();
    } finally {
      mongoose.Model.findOne = originalFindOne;
      mongoose.Model.prototype.save = originalSave;
    }
  });
});

