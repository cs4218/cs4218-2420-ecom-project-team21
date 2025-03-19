import React from "react";
import { render, screen } from "@testing-library/react";
import Orders from "./Orders";
import axios from "axios";
import { useAuth } from "../../context/auth";
import "@testing-library/jest-dom";

// Mock modules
jest.mock("axios");
jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/UserMenu", () => () => <div>User Menu</div>);

// Helper function to mock auth context
const mockAuthContext = (token = "fake-token", user = { name: "Test User" }) => {
  useAuth.mockReturnValue([{ token, user }, jest.fn()]);
};

// Helper function to mock orders API response
const mockOrdersAPI = (orders) => {
  axios.get.mockResolvedValue({ data: orders });
};

// Test suite for Orders component
describe("Orders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mocks
  });

  it("should render the orders from the API", async () => {
    const mockOrders = [
      {
        _id: "order1",
        status: "Delivered",
        buyer: { name: "tyy" },
        createAt: "2024-09-09T12:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "1",
            name: "Product 1",
            description: "Description of Product 1",
            price: 10,
          },
        ],
      },
    ];

    mockAuthContext(); // Mock auth context
    mockOrdersAPI(mockOrders); // Mock API response

    render(<Orders />);

    // Assertions
    expect(await screen.findByText("All Orders")).toBeInTheDocument();
    expect(await screen.findByText("Delivered")).toBeInTheDocument();
    expect(await screen.findByText("tyy")).toBeInTheDocument();
    expect(await screen.findByText("Success")).toBeInTheDocument();
    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Price : 10")).toBeInTheDocument();
  });

  it("should render UserMenu and Layout components", async () => {
    mockAuthContext(); // Mock auth context

    render(<Orders />);

    // Assertions
    expect(screen.getByText("User Menu")).toBeInTheDocument();
    expect(screen.getByText("All Orders")).toBeInTheDocument();
  });

  it("should render orders with multiple products", async () => {
    const mockOrders = [
      {
        _id: "order1",
        status: "Delivered",
        buyer: { name: "tyy" },
        createAt: "2024-09-09T12:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "1",
            name: "Product 1",
            description: "Description of Product 1",
            price: 10,
          },
          {
            _id: "2",
            name: "Product 2",
            description: "Description of Product 2",
            price: 20,
          },
        ],
      },
    ];

    mockAuthContext(); // Mock auth context
    mockOrdersAPI(mockOrders); // Mock API response

    render(<Orders />);

    // Assertions for multiple products
    expect(await screen.findByText("Product 1")).toBeInTheDocument();
    expect(await screen.findByText("Product 2")).toBeInTheDocument();
  });

  it("should render a failed payment status", async () => {
    const mockOrders = [
      {
        _id: "order1",
        status: "Not Processed",
        buyer: { name: "tyy" },
        createAt: "2024-09-09T12:00:00Z",
        payment: { success: false },
        products: [
          {
            _id: "1",
            name: "Product 1",
            description: "Description of Product 1",
            price: 10,
          },
        ],
      },
    ];

    mockAuthContext(); // Mock auth context
    mockOrdersAPI(mockOrders); // Mock API response

    render(<Orders />);

    // Assertions for failed payment
    expect(await screen.findByText("Not Processed")).toBeInTheDocument();
    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });

  it("should render an order even if some product information is missing", async () => {
    const mockOrders = [
      {
        _id: "order1",
        status: "Delivered",
        buyer: { name: "tyy" },
        createAt: "2024-09-09T12:00:00Z",
        payment: { success: true },
        products: [
          {
            _id: "1",
            name: null,
            description: "Description of Product 1",
            price: null,
          },
        ],
      },
    ];

    mockAuthContext(); // Mock auth context
    mockOrdersAPI(mockOrders); // Mock API response

    render(<Orders />);

    // Assertions for missing product information
    expect(await screen.findByText("Description of Product 1")).toBeInTheDocument();
    expect(screen.queryByText("Price : ")).not.toBeInTheDocument();
  });
});
