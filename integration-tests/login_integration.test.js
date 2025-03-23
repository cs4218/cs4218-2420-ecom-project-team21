import { test, describe, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

let mongoServer;

// Setup test database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);

  // Create a test user for login tests
  const hashedPassword = await hashPassword("Pass123!");
  await userModel.create({
    name: "Test User",
    email: "test@example.com",
    password: hashedPassword,
    phone: "123-456-7890",
    address: "Test Address",
    answer: "Football"
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongoServer.stop();
  server.close();
});

beforeEach(async () => {
  await userModel.deleteMany({ email: { $ne: "test@example.com" } });
});

describe("User Login API Tests", () => {
  test("should login successfully with valid credentials", async () => {
    const loginData = {
      email: "test@example.com",
      password: "Pass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(loginData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("login successfully");
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe(loginData.email);
    expect(response.body.token).toBeDefined();
    
    // Verify token is valid
    const decoded = JWT.verify(response.body.token, process.env.JWT_SECRET);
    expect(decoded._id).toBeDefined();
  });

  test("should return error when email and password are missing", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({});

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
  });

  test("should return error when email is missing", async () => {
    const missingEmailData = {
      password: "Pass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(missingEmailData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
  });

  test("should return error when password is missing", async () => {
    const missingPasswordData = {
      email: "test@example.com"
    };

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(missingPasswordData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid email or password");
  });

  test("should return error when email is not registered", async () => {
    const nonExistentEmailData = {
      email: "nonexistent@example.com",
      password: "Pass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(nonExistentEmailData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email is not registerd");
  });

  test("should return error when password is incorrect", async () => {
    const incorrectPasswordData = {
      email: "test@example.com",
      password: "WrongPass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(incorrectPasswordData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid Password");
  });

  test("should handle server errors during login", async () => {
    const originalFindOne = mongoose.Model.findOne;
    
    try {
      mongoose.Model.findOne = jest.fn().mockRejectedValue(new Error("Database error"));
      
      const loginData = {
        email: "error@example.com",
        password: "Pass123!"
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in login");
      expect(response.body.error).toBeDefined();
    } finally {
      mongoose.Model.findOne = originalFindOne;
    }
  });

  test("should handle JWT signing errors", async () => {
    const originalSign = JWT.sign;
    
    try {
      JWT.sign = jest.fn().mockImplementation(() => {
        throw new Error("JWT signing error");
      });
      
      const loginData = {
        email: "test@example.com",
        password: "Pass123!"
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Error in login");
    } finally {
      JWT.sign = originalSign;
    }
  });

  test("should return appropriate error for invalid email format", async () => {
    const invalidEmailData = {
      email: "invalid-email",
      password: "Pass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(invalidEmailData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Email is not registerd");
  });

  test("should handle password comparison failures", async () => {
    await userModel.create({
      name: "Hash Test User",
      email: "hashtest@example.com",
      password: "invalid_hash_format",
      phone: "123-456-7890",
      address: "Test Address",
      answer: "Football"
    });

    const loginData = {
      email: "hashtest@example.com",
      password: "AnyPassword123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send(loginData);

    expect(response.body.success).toBe(false);
  });
});
