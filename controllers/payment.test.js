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
jest.mock('slugify', () => {
  return jest.fn().mockReturnValue('product');
});
jest.mock('braintree', () => ({
  BraintreeGateway: jest.fn(() => {
    return {
      clientToken: {
        generate: jest.fn(),
      },
      transaction: {
        sale: jest.fn(),
      },
    };
  }),
  Environment: {
    Sandbox: 'sandbox',
  },
}));

// Get the gateway object
const gateway = braintree.BraintreeGateway.mock.results[0].value;

// Define reusable mock response
const createMockResponse = () => ({
  send: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('braintreeTokenController', () => {
  let request, response, logSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    request = {};
    response = createMockResponse(); // Use reusable response mock
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should obtain braintree controller token successfully', async () => {
    gateway.clientToken.generate.mockImplementationOnce((_, callback) => {
      callback(null, token);
    });

    await braintreeTokenController(request, response);

    expect(response.send).toHaveBeenCalledWith(token);
  });

  it('should handle error when token generation fails', async () => {
    const error = new Error('Error while getting token');

    gateway.clientToken.generate.mockImplementationOnce((_, callback) => {
      callback(error, null);
    });

    await braintreeTokenController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith(error);
  });

  it('should log error when generate() fails', async () => {
    const error = new Error('Error while getting token');
    gateway.clientToken.generate.mockImplementationOnce((_, callback) => {
      throw error;
    });

    await braintreeTokenController(request, response);

    expect(logSpy).toHaveBeenCalledWith(error);
  });
});

describe('brainTreePaymentController', () => {
  let request, response, logSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    request = {
      body: {
        nonce: 'nonce',
        cart: [mockedProductData],
      },
      user: {
        _id: '123',
      },
    };
    response = createMockResponse(); // Use reusable response mock
    orderModel.prototype.save.mockResolvedValue(txnSuccess);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  it('should make payment successfully', async () => {
    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      callback(null, txnSuccess);
    });

    await brainTreePaymentController(request, response);

    expect(response.json).toHaveBeenCalledWith({ ok: true });
  });

  it('should handle payment failure with error response', async () => {
    const error = new Error('Payment failed');

    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      callback(error, null);
    });

    await brainTreePaymentController(request, response);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith(error);
  });

  it('should log error when sale() fails', async () => {
    const error = new Error('Payment failed');
    gateway.transaction.sale.mockImplementationOnce((_, callback) => {
      throw error;
    });

    await brainTreePaymentController(request, response);

    expect(logSpy).toHaveBeenCalledWith(error);
  });
});
