import { expect, jest } from "@jest/globals";
import { registerController, loginController, forgotPasswordController, testController } from "./authController";
import userModel from "../models/userModel";
import * as authHelper from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");
jest.mock("./../helpers/authHelper.js", () => ({
  ...jest.requireActual("./../helpers/authHelper.js"),
  validateEmail: (email) => {
      return String(email)
          .toLowerCase()
          .match(
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          );
  },
  validatePhone: (phone) => {
      const pattern = /^(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;
      return pattern.test(phone);
  },
  validatePassword: (password) => {
      const pattern = /^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/;
      return pattern.test(password);
  },
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

describe("Register Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    JWT.sign.mockReturnValue("mocked_token");
  });

  test("email is empty", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "",
        password: "Pass123!",
        phone: "123-456-7890",
        address: "123 Street",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test("name is empty", async () => {
    req = {
      body: {
        name: "",
        email: "john@example.com",
        password: "Pass123!",
        phone: "123-456-7890",
        address: "123 Street",
        answer: "Football", 
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test("password is empty", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "",
        phone: "123-456-7890",
        address: "123 Street",
        answer: "Football",
      }
    };  

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  }); 

  test("phone is empty", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "Pass123!",
        phone: "",
        address: "123 Street",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test("address is empty", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "Pass123!",
        phone: "123-456-7890",
        address: "",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test("answer is empty", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "Pass123!",
        phone: "123-456-7890",
        address: "123 Street",
        answer: "",
      }
    };
  
    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test("existing user cannot register again", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "existing@example.com",
        password: "Pass123!",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      }
    };
    
    // when userModel.findOne is called, it should return a user with the email "existing@example.com"
    userModel.findOne = jest.fn().mockResolvedValue({
      email: "existing@example.com"
    });
    userModel.prototype.save = jest.fn();

    await registerController(req, res);

    // verify the response
    // like the status code and the meassge.
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Already Register please login"
    });
    // ensure that the new user is not saved
    expect(userModel.prototype.save).not.toHaveBeenCalled();
  });

  test("user is saved successfully", async () => {
    const newUser = {
      name: "John Doe",
      email: "john@example.com",
      password: "Pass123!",
      phone: "12344000",
      address: "123 Street",
      answer: "Football",
    };

    req = {
      body: newUser
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    
    const savedUser = { ...newUser, _id: "userid" };
    userModel.prototype.save = jest.fn().mockResolvedValue(savedUser);

    await registerController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "User Register Successfully",
      user: expect.any(Object)
    });
    expect(userModel.prototype.save).toHaveBeenCalled();
  });

  test("invalid email", async () => { 
    req = {
      body: {
        name: "John Doe",
        email: "invalid-email",
        password: "Pass123!",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);

    expect(userModel.prototype.save).not.toHaveBeenCalled();
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Email"
    });
  });

  test("invalid phone number", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "Pass123!",
        phone: "invalid-phone",
        address: "123 Street",
        answer: "Football",
      }
    };  

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);

    expect(userModel.prototype.save).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Phone Number"
    });
  });

  test("error in registration", async () => {
    req = {
      body: {
        name: "John Doe", 
        email: "john@example.com",
        password: "Pass123!",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn().mockRejectedValue(new Error("Registration failed"));

    await registerController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in Registeration",
      error: expect.any(Error),
    });
    expect(userModel.prototype.save).toHaveBeenCalled();
  });

  test("password is too short", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "abc123$",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);

    expect(userModel.prototype.save).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  test("password is too long", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "abc123$1234567890",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);

    expect(userModel.prototype.save).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  test("password is all numbers", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "1234567890",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);

    expect(userModel.prototype.save).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  test("password is all letters", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "abcdefgsd",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    
    expect(userModel.prototype.save).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  test("password doesn't have special characters", async () => {
    req = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "12344000",
        address: "123 Street",
        answer: "Football",
      }
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);
    userModel.prototype.save = jest.fn();

    await registerController(req, res);
    
    expect(userModel.prototype.save).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });
});

describe("Login Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("email is empty", async () => {
    req = {
      body: {
          email: "",
        password: "Pass123!",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid email or password",
    });
  });

  test("email is not registered", async () => {
    req = {
      body: {
        email: "nonexistent@example.com",
        password: "Pass123!",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Email is not registerd",
    });

    expect(userModel.findOne).toHaveBeenCalledWith({ email: "nonexistent@example.com" });
  });

  test("invalid password", async () => {  
    const existingUser = {
      _id: "userid",
      name: "John Doe",
      email: "john@example.com",
      password: "hashedPassword",
      phone: "12344000",
      address: "123 Street",
      answer: "Football",
    };

    req = {
      body: {
        email: "john@example.com",
        password: "wrong_password",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(existingUser);
    authHelper.comparePassword.mockResolvedValue(false);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid Password",
    });

    expect(userModel.findOne).toHaveBeenCalledWith({ email: "john@example.com" });
  });

  test("login successful", async () => {
    const existingUser = {
      _id: "userid",
      name: "John Doe",
      email: "john@example.com",
      password: "hashedPassword",
      phone: "12344000",
      address: "123 Street",
      answer: "Football",
    };

    req = {
      body: {
        email: "john@example.com",
        password: "Pass123!",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(existingUser);
    authHelper.comparePassword.mockResolvedValue(true);

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "login successfully",
      user: expect.any(Object),
      token: "mocked_token",
    });

    expect(userModel.findOne).toHaveBeenCalledWith({ email: "john@example.com" });
  });

  test("login failed", async () => {
    const existingUser = {
      _id: "userid",
      name: "John Doe",
      email: "john@example.com",
      password: "hashedPassword",
      phone: "12344000",
      address: "123 Street",
      answer: "Football",
    };

    const req = {
      body: {
        email: "john@example.com",
        password: "wrong_password",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(existingUser);
    authHelper.comparePassword.mockRejectedValue(new Error("Login failed"));

    await loginController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error in login",
      error: expect.any(Error),
    });
  });  
  
});

describe("Forgot Password Controller Test", () => {
  // TODO: need to check that email should be valid 
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  test("email is empty", async () => {
    req = {
      body: {
        email: "",
        answer: "Football",
        newPassword: "newPass123!",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Email is required",
    });
  });

  test("answer is empty", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "",
        newPassword: "newPasswo rd123",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "answer is required",
    });
  });

  test("new password is empty", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "Football",
        newPassword: "",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);  

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "New Password is required",
    });
  });

  test("user not found", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "Football",
        newPassword: "newPass123!",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue(null);

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Wrong Email Or Answer",
    });
  });

  test("password reset successfully", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "Football",
        newPassword: "newPass123!",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue({
      email: "john@example.com",
      answer: "Football",
    });

    userModel.findByIdAndUpdate = jest.fn().mockResolvedValue({
      email: "john@example.com",
      answer: "Football",
    });

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Password Reset Successfully",
    });
  });
  
  test("something went wrong in forgot password", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "Football",
        newPassword: "newPass123!",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue({
      email: "john@example.com",
      answer: "Football",
    });

    userModel.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error("Something went wrong")); 

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Something went wrong",
      error: expect.any(Error),
    });
  });
  
  test("new password is all numbers", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "Football",
        newPassword: "12345678",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue({
      email: "john@example.com",
      answer: "Football",
    });

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  test("new password is all letters", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "Football",
        newPassword: "abcdefgh",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue({
      email: "john@example.com",
      answer: "Football",
    });

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  test("new password is too short", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "Football",
        newPassword: "Abc1!",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue({
      email: "john@example.com",
      answer: "Football",
    });

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });

  test("new password is too long", async () => {
    req = {
      body: {
        email: "john@example.com",
        answer: "Football",
        newPassword: "Abc123!@#$%^&*1234567",
      },
    };

    userModel.findOne = jest.fn().mockResolvedValue({
      email: "john@example.com",
      answer: "Football",
    });

    await forgotPasswordController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Invalid password",
    });
  });
});

describe("Test Controller Test", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    req = {};
  });

  test("test success", async () => {
    await testController(req, res);
    expect(res.send).toHaveBeenCalledWith("Protected Routes");
  });

  test("test failed with error", async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const error = new Error("Test failed");
    res.send.mockImplementationOnce(() => {
      throw error;
    }).mockImplementationOnce((arg) => arg);

    await testController(req, res);

    expect(consoleSpy).toHaveBeenCalledWith(error);
    
    expect(res.send).toHaveBeenLastCalledWith({ error });

    consoleSpy.mockRestore();
  });
});