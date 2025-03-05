import { jest } from "@jest/globals";
import { getOrdersController , orderStatusController, getAllOrdersController} from "./authController";
import orderModel from '../models/orderModel';

jest.mock("../models/userModel.js");
jest.mock('../models/orderModel');
jest.mock('../helpers/authHelper');

describe('Get Orders Unit test', () => {
    let mockReq, mockRes;
    
    beforeEach(() => {
        mockReq = {
            user: { _id: '123' }
        };
        mockRes = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should provide relevant records for the user', async () => {
        const dummyOrders = [
            {
                _id: '1',
                products: [
                    { name: 'Product 1 ', price: 100 },
                    { name: 'Product 2', price: 200 }
                ],
                buyer: {
                    name: 'Adriel'
                }
            }
        ];

        orderModel.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(dummyOrders)
            })
        });

        await getOrdersController(mockReq, mockRes);

        expect(orderModel.find).toHaveBeenCalledWith({ buyer: '123' });
        expect(mockRes.json).toHaveBeenCalledWith(dummyOrders);
    });

    it('should respond gracefully on retrieval failure', async () => {
        const simulatedError = new Error('Data Retrieval Issue');
        
        orderModel.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(simulatedError)
            })
        });

        await getOrdersController(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.send).toHaveBeenCalledWith({
            success: false,
            message: "Error While Getting Orders",
            error: simulatedError
        });
    });

    it('should execute field population accurately', async () => {
        const secondaryPopulateMock = jest.fn().mockResolvedValue([]);
        const primaryPopulateMock = jest.fn().mockReturnValue({
            populate: secondaryPopulateMock
        });
        
        orderModel.find.mockReturnValue({
            populate: primaryPopulateMock
        });

        await getOrdersController(mockReq, mockRes);

        expect(primaryPopulateMock).toHaveBeenCalledWith('products', '-photo');
        expect(secondaryPopulateMock).toHaveBeenCalledWith('buyer', 'name');
    });
});


describe("Order Status Update and Tracking", () => {
    let mockReq, mockRes;
  
    beforeEach(() => {
      mockReq = {
        params: { orderId: "123" },
        body: { status: "Processing" }
      };
      mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      jest.clearAllMocks();
    });
  
    it('should successfully update order status', async () => {
        const mockUpdatedOrder = {
          _id: '123',
          status: 'Processing',
          products: [
            { name: 'Product 1', price: 100 }
          ]
        };
    
        orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);
    
        await orderStatusController(mockReq, mockRes);
    
        expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
          '123',
          { status: 'Processing' },
          { new: true }
        );
        expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedOrder);
    });
  
    it("should return 404 if order not found", async () => {
      orderModel.findById.mockResolvedValue(null);
  
      await orderStatusController(mockReq, mockRes);
  
      expect(orderModel.findById).toHaveBeenCalledWith("123");
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Order not found"
      });
    });
  
    it("should handle errors during status update", async () => {
      const mockError = new Error("Database error");
  
      orderModel.findById.mockRejectedValue(mockError);
  
      await orderStatusController(mockReq, mockRes);
  
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.send).toHaveBeenCalledWith({
        success: false,
        message: "Failed to update order status",
        error: mockError
      });
    });
  });


  describe('getAllOrdersController unit tests', () => {
    let req;
    let res;
    
    beforeEach(() => {
        req = {};
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        jest.clearAllMocks();
    });

    it('should successfully retrieve all orders with sorted dates', async () => {
        const mockOrders = [
            {
                _id: '123',
                products: [
                    { name: 'Product 1', price: 100 },
                    { name: 'Product 2', price: 200 }
                ],
                buyer: {
                    name: 'John'
                },
                createdAt: new Date('2024-02-16')
            },
            {
                _id: '234',
                products: [
                    { name: 'Product 3', price: 300 }
                ],
                buyer: {
                    name: 'Smith'
                },
                createdAt: new Date('2024-02-15')
            }
        ];

        // Reusable mock functions for chaining mongoose methods
        const sortMock = jest.fn().mockResolvedValue(mockOrders);
        const secondPopulateMock = jest.fn().mockReturnValue({ sort: sortMock });
        const firstPopulateMock = jest.fn().mockReturnValue({
            populate: secondPopulateMock
        });

        // Mock the find method with chained populate calls
        orderModel.find.mockReturnValue({
            populate: firstPopulateMock
        });

        await getAllOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalledWith({});
        expect(firstPopulateMock).toHaveBeenCalledWith('products', '-photo');
        expect(secondPopulateMock).toHaveBeenCalledWith('buyer', 'name');
        expect(sortMock).toHaveBeenCalledWith({ createdAt: '-1' });
        expect(res.json).toHaveBeenCalledWith(mockOrders);
    });

    it('should handle errors gracefully when retrieving all orders', async () => {
        const mockError = new Error('Database Error');

        // Mock the chain to reject with an error
        const sortMock = jest.fn().mockRejectedValue(mockError);
        const secondPopulateMock = jest.fn().mockReturnValue({ sort: sortMock });
        const firstPopulateMock = jest.fn().mockReturnValue({
            populate: secondPopulateMock
        });

        orderModel.find.mockReturnValue({
            populate: firstPopulateMock
        });

        await getAllOrdersController(req, res);

        expect(orderModel.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: "Error While Getting All Orders",
            error: mockError
        });
    });
});