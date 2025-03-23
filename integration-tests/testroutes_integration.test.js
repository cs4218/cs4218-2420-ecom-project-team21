import { test, describe, expect, beforeAll, afterAll } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

let mongoServer;
let testUser;
let testUserToken;

jest.setTimeout(30000);

// Setup test database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);

  // Create a test user
  const hashedPassword = await hashPassword("Pass123!");
  testUser = await userModel.create({
    name: "Test User",
    email: "test@example.com",
    password: hashedPassword,
    phone: "123-456-7890",
    address: "Test Address",
    answer: "Football",
    role: 1
  });

  testUserToken = JWT.sign({ _id: testUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await new Promise(resolve => server.close(resolve));
});

describe("Test Routes Integration Tests", () => {
  test("should allow access to protected route with valid token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/test")
      .set("Authorization", testUserToken);
    
    expect(response.status).toBe(200);
    expect(response.text).toBe("Protected Routes");
  }, 15000);

  test("should deny access to protected route without token", async () => {
    const response = await request(app)
      .get("/api/v1/auth/test");
    
    expect(response.status).toBe(401);
  }, 15000);

  test("should deny access with invalid token", async () => {
    const invalidToken = "invalid_token";
    
    const response = await request(app)
      .get("/api/v1/auth/test")
      .set("Authorization", invalidToken);

    expect(response.status).toBe(401);
  }, 30000);

  test("should deny access with expired token", async () => {
    // Create an immediately expired token
    const expiredToken = JWT.sign(
      { _id: testUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1ms' }
    );
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const response = await request(app)
      .get("/api/v1/auth/test")
      .set("Authorization", expiredToken);

    expect(response.status).toBe(401);
  }, 15000);

  test("should handle errors in the controller", async () => {
    const response = await request(app)
      .get("/api/v1/auth/test?error=true")
      .set("Authorization", testUserToken);

    expect(response.status).toBe(200);
  }, 15000);
});