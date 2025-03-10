import { expect, jest, test, describe, beforeEach } from "@jest/globals";
import bcrypt from "bcrypt";
import { 
  hashPassword, 
  comparePassword, 
  validateEmail, 
  validatePhone, 
  validatePassword 
} from "./authHelper.js";

jest.mock("bcrypt");

describe("authHelper functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    test("should hash a password successfully", async () => {
      const mockHashedPassword = "hashedPassword123";
      bcrypt.hash.mockResolvedValue(mockHashedPassword);
      
      const result = await hashPassword("password123");
      
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(result).toBe(mockHashedPassword);
    });

    test("should handle errors", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      const mockError = new Error("Hashing failed");
      bcrypt.hash.mockRejectedValue(mockError);
      
      await hashPassword("password123");
      
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      consoleLogSpy.mockRestore();
    });
  });

  describe("comparePassword", () => {
    test("should return true for matching passwords", async () => {
      bcrypt.compare.mockResolvedValue(true);
      
      const result = await comparePassword("password123", "hashedPassword123");
      
      expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedPassword123");
      expect(result).toBe(true);
    });

    test("should return false for non-matching passwords", async () => {
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await comparePassword("wrongPassword", "hashedPassword123");
      
      expect(bcrypt.compare).toHaveBeenCalledWith("wrongPassword", "hashedPassword123");
      expect(result).toBe(false);
    });
  });

  describe("validateEmail", () => {
    test("should return match array for valid emails", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user-name@domain.com",
        "username123@domain.com",
        "user_name@domain.com"
      ];
      
      validEmails.forEach(email => {
        expect(validateEmail(email)).not.toBeNull();
      });
    });

    test("should return null for invalid emails", () => {
      const invalidEmails = [
        "test@example",
        "test.com",
        "@domain.com",
        "test@.com",
        "test@domain.",
        "te st@domain.com",
        "test@dom_ain.com"
      ];
      
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBeNull();
      });
    });
  });

  describe("validatePhone", () => {
    test("should return true for valid phone numbers", () => {
      const validPhones = [
        "1234567890",
        "123-456-7890",
        "123.456.7890",
        "123 456 7890",
        "(123) 456-7890",
        "+1 123-456-7890",
        "+1-123-456-7890"
      ];
  
      validPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(true);
      });
    });
  
    test("should return false for invalid phone numbers", () => {
      const invalidPhones = [
        "12345",
        "abcdefghij",
        "123-456-789",
        "123 456 789a",
        "123456789012345",
        "+1 12345",
        "+1-123-456-78901"
      ];
  
      invalidPhones.forEach(phone => {
        expect(validatePhone(phone)).toBe(false);
      });
    });
  });  

  describe("validatePassword", () => {
    test("should return true for valid passwords", () => {
      const validPasswords = [
        "Password1!",
        "Secure123#",
        "Test@1234",
        "Complex!99",
        "P@ssw0rd"
      ];
      
      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    test("should return false for invalid passwords", () => {
      const invalidPasswords = [
        "password",
        "Password",
        "password1",
        "Password!",
        "Pass1!",
        "VeryLongPassword1234567!",
        "Pass word1!",
        "Password1"
      ];
      
      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });
  });
});