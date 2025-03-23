import { test, describe, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { server, app } from "../server.js";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

let mongoServer;
let testUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);

  const hashedPassword = await hashPassword("OldPass123!");
  testUser = await userModel.create({
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
  const hashedPassword = await hashPassword("OldPass123!");
  await userModel.findByIdAndUpdate(testUser._id, { password: hashedPassword });
});

describe("Forgot Password Integration Tests", () => {
  test("should reset password successfully with correct email and answer", async () => {
    const resetData = {
      email: "test@example.com",
      answer: "Football",
      newPassword: "NewPass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(resetData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Password Reset Successfully");
    
    const updatedUser = await userModel.findById(testUser._id);
    expect(updatedUser.password).not.toBe(testUser.password);
  });

  test("should return error when email is missing", async () => {
    const missingEmailData = {
      answer: "Football",
      newPassword: "NewPass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(missingEmailData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email is required");
  });

  test("should return error when answer is missing", async () => {
    const missingAnswerData = {
      email: "test@example.com",
      newPassword: "NewPass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(missingAnswerData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("answer is required");
  });

  test("should return error when new password is missing", async () => {
    const missingPasswordData = {
      email: "test@example.com",
      answer: "Football"
    };

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(missingPasswordData);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("New Password is required");
  });

  test("should validate password strength", async () => {
    const weakPasswordData = {
      email: "test@example.com",
      answer: "Football",
      newPassword: "weak" // Too weak password
    };

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(weakPasswordData);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid password");
  });

  test("should return error for non-existent email", async () => {
    const nonExistentEmailData = {
      email: "nonexistent@example.com",
      answer: "Football",
      newPassword: "NewPass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(nonExistentEmailData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Wrong Email Or Answer");
  });

  test("should return error for incorrect security answer", async () => {
    const incorrectAnswerData = {
      email: "test@example.com",
      answer: "Basketball", // Incorrect answer
      newPassword: "NewPass123!"
    };

    const response = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send(incorrectAnswerData);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Wrong Email Or Answer");
  });

  test("should handle database errors during user lookup", async () => {
    const originalFindOne = mongoose.Model.findOne;
    
    try {
      mongoose.Model.findOne = jest.fn().mockRejectedValue(new Error("Database error"));
      
      const resetData = {
        email: "test@example.com",
        answer: "Football",
        newPassword: "NewPass123!"
      };

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send(resetData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong");
      expect(response.body.error).toBeDefined();
    } finally {
      mongoose.Model.findOne = originalFindOne;
    }
  });

  test("should handle errors during password update", async () => {
    const originalFindByIdAndUpdate = mongoose.Model.findByIdAndUpdate;
    
    try {
      const originalFindOne = mongoose.Model.findOne;
      
      mongoose.Model.findByIdAndUpdate = jest.fn().mockRejectedValue(
        new Error("Update error")
      );
      
      const resetData = {
        email: "test@example.com",
        answer: "Football",
        newPassword: "NewPass123!"
      };

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send(resetData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong");
      expect(response.body.error).toBeDefined();
    } finally {
      mongoose.Model.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
  });

  test("should handle errors during password hashing", async () => {
    const originalHashPassword = require("../helpers/authHelper.js").hashPassword;
    
    try {
      require("../helpers/authHelper.js").hashPassword = jest.fn().mockRejectedValue(
        new Error("Hashing error")
      );
      
      const resetData = {
        email: "test@example.com",
        answer: "Football",
        newPassword: "NewPass123!"
      };

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send(resetData);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Something went wrong");
    } finally {
      require("../helpers/authHelper.js").hashPassword = originalHashPassword;
    }
  });
});
