import { requireSignIn, isAdmin } from './authMiddleware';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';

jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js');

describe('requireSignIn middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {
        authorization: 'Bearer token123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
    console.log = jest.fn();
    process.env.JWT_SECRET = 'testsecret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should set req.user and call next when token is valid', async () => {
    const decodedToken = { _id: 'user123', name: 'Test User' };
    JWT.verify.mockReturnValue(decodedToken);

    await requireSignIn(req, res, next);

    expect(JWT.verify).toHaveBeenCalledWith('Bearer token123', 'testsecret');
    expect(req.user).toEqual(decodedToken);
    expect(next).toHaveBeenCalled();
  });

  test('should handle error when token verification fails', async () => {
    const error = new Error('Invalid token');
    JWT.verify.mockImplementation(() => {
      throw error;
    });

    await requireSignIn(req, res, next);

    expect(JWT.verify).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(error);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('isAdmin middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { _id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should call next when user is admin (role=1)', async () => {
    const mockUser = { _id: 'user123', role: 1 };
    userModel.findById.mockResolvedValue(mockUser);

    await isAdmin(req, res, next);

    expect(userModel.findById).toHaveBeenCalledWith('user123');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  test('should return 401 when user is not admin (role!=1)', async () => {
    const mockUser = { _id: 'user123', role: 0 };
    userModel.findById.mockResolvedValue(mockUser);

    await isAdmin(req, res, next);

    expect(userModel.findById).toHaveBeenCalledWith('user123');
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'UnAuthorized Access'
    });
  });

  test('should handle errors and return 401', async () => {
    const error = new Error('Database error');
    userModel.findById.mockRejectedValue(error);

    await isAdmin(req, res, next);

    expect(userModel.findById).toHaveBeenCalledWith('user123');
    expect(console.log).toHaveBeenCalledWith(error);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error: error,
      message: 'Error in admin middleware'
    });
  });
});