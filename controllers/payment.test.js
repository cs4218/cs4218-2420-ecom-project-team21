import { describe } from 'node:test';
import orderModel from '../models/orderModel';
import {
  braintreeTokenController,
  brainTreePaymentController,
} from './productController';
import braintree from 'braintree';

const token = { token: 'token' };
const txnSuccess = { success: true };

jest.mock('fs');
jest.mock('../models/orderModel');
jest.mock('slugify', () => jest.fn().mockReturnValue('product'));
jest.mock('braintree', () => ({
  BraintreeGateway: jest.fn(() => ({
    clientToken: {
      generate: jest.fn(),
    },
    transaction: {
      sale: jest.fn(),
    },
  })),
  Environment: {
    Sandbox: 'sandbox',
  },
}));

// Get the gateway object
const gateway = braintree.BraintreeGateway.mock.results[0].value;

// Reusable mock response
const createMockResponse = () => ({
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});


let logSpy;
beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  logSpy.mockRestore();
});

describe('braintreeTokenController', () => {
  let request, response;

  beforeEach(() => {
    jest.clearAllMocks();
    request = {};
    response = createMockResponse();
  });

  it('should obtain braintree controller token successfully', async () => {
    const token = { clientToken: "mocked-client-token" }; 

    gateway.clientToken.generate.mockImplementationOnce((_ , callback) => {
      callback(null, token); // Return correct token format
    });

    await braintreeTokenController(request, response);

    expect(response.send).toHaveBeenCalledWith(token);
});


  it('should handle error when token generation fails', async () => {
    const error = new Error('Error while getting token');

    gateway.clientToken.generate.mockImplementationOnce((_ , callback) => {
      callback(error, null);
    });

    await braintreeTokenController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith(error);
  });

  it('should log error when generate() throws errors', async () => {
    const error = new Error('Error while getting token');
    gateway.clientToken.generate.mockImplementationOnce(() => {
      throw error;
    });

    await braintreeTokenController(request, response);

    expect(logSpy).toHaveBeenCalledWith(error);
  });

  
  it('should handle empty token response gracefully', async () => {
    gateway.clientToken.generate.mockImplementationOnce((_ , callback) => {
      callback(null, {}); // Returning an empty object to simulate the issue
    });
  
    await braintreeTokenController(request, response);
  
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith(expect.any(Object));
  });
  
  
  it('should not log sensitive information', async () => {
    gateway.clientToken.generate.mockImplementationOnce((_, callback) => {
      callback(null, token);
    });

    await braintreeTokenController(request, response);

    expect(logSpy).not.toHaveBeenCalledWith(expect.stringMatching(/clientToken|token/i));
  });
});

describe('brainTreePaymentController', () => {
  let request, response;

  beforeEach(() => {
    jest.clearAllMocks();
    request = {
      body: {
        nonce: 'nonce',
        cart: [{ _id: 'product1', price: 100 }],
      },
      user: {
        _id: '123',
      },
    };
    response = createMockResponse();
    orderModel.prototype.save.mockResolvedValue(txnSuccess);
  });

  it('should make payment successfully and create an order', async () => {
    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      callback(null, txnSuccess);
    });

    await brainTreePaymentController(request, response);

    expect(response.json).toHaveBeenCalledWith({ ok: true });
    expect(orderModel.prototype.save).toHaveBeenCalled();
  });

  it('should not create order when payment fails', async () => {
    const error = new Error('Payment failed');

    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      callback(error, null);
    });

    await brainTreePaymentController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith(error);
    expect(orderModel.prototype.save).not.toHaveBeenCalled();
  });

  it('should log error when sale() throws', async () => {
    const error = new Error('Payment failed');
    gateway.transaction.sale.mockImplementationOnce(() => {
      throw error;
    });

    await brainTreePaymentController(request, response);

    expect(logSpy).toHaveBeenCalledWith(error);
  });

  it('should handle empty cart with 400 status', async () => {
    request.body.cart = [];

    await brainTreePaymentController(request, response);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.send).toHaveBeenCalledWith({
      success: false,
      message: "Cart is Empty"
    });
  });

  it('should handle unauthenticated user with 401 status', async () => {
    delete request.user;

    await brainTreePaymentController(request, response);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.send).toHaveBeenCalledWith(new Error('User not authenticated'));
  });

  it('should prevent duplicate transactions', async () => {
    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      callback(null, txnSuccess);
    });

    await brainTreePaymentController(request, response);
    await brainTreePaymentController(request, response);

    expect(response.json).toHaveBeenCalledTimes(1);
  });

});
