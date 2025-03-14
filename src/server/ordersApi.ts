import express, { Router, Request, Response, RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateBestsellerData } from "./bestsellerApi.js";
import type { Order, CompletedOrder } from '../types/order';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ordersFile = path.join(__dirname, "..", "data", "orders.json");
const completedOrdersFile = path.join(__dirname, "..", "data", "completedOrders.json");

const router = Router();

// Helper to read orders
const readOrders = () => {
  try {
    if (!fs.existsSync(ordersFile)) {
      const initialData = { orders: [] };
      fs.writeFileSync(ordersFile, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(ordersFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading orders:", error);
    throw error;
  }
};

// Helper to read completed orders
const readCompletedOrders = () => {
  try {
    if (!fs.existsSync(completedOrdersFile)) {
      const initialData = { completedOrders: [] };
      fs.writeFileSync(completedOrdersFile, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(completedOrdersFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading completed orders:", error);
    throw error;
  }
};

// Create new order
const createOrder: RequestHandler = (req, res) => {
  try {
    const data = readOrders();
    const newOrder = {
      id: `ORD${String(data.orders.length + 1).padStart(3, "0")}`,
      ...req.body,
      timeOfOrder: new Date().toISOString()
    };
    
    // Ensure items are properly formatted with name and quantity
    if (newOrder.items && Array.isArray(newOrder.items)) {
      // Make sure each item has both name and quantity properties
      newOrder.items = newOrder.items.map(item => {
        if (typeof item === 'string') {
          return { name: item, quantity: 1 };
        } else if (typeof item === 'object' && item !== null) {
          return {
            name: item.name,
            quantity: item.quantity || 1
          };
        }
        return item;
      });
    }
    
    data.orders.push(newOrder);
    fs.writeFileSync(ordersFile, JSON.stringify(data, null, 2));
    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Get all orders
const getOrders: RequestHandler = (req, res) => {
  try {
    const data = readOrders();
    const completedData = readCompletedOrders();
    res.json({ 
      orders: data.orders,
      completedOrders: completedData.completedOrders 
    });
  } catch (error) {
    console.error("Error reading orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Complete order
const completeOrder: RequestHandler = (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const ordersData = readOrders();
    const completedOrdersData = readCompletedOrders();
    
    const orderIndex = ordersData.orders.findIndex((order: Order) => order.id === orderId);
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Create a deep copy of the order to avoid reference issues
    const orderToComplete = JSON.parse(JSON.stringify(ordersData.orders[orderIndex]));
    
    // Ensure items are stored with their quantities
    const completedOrder: CompletedOrder = {
      ...orderToComplete,
      timeCompleted: new Date().toISOString()
    };

    // Ensure each item has proper name and quantity properties
    if (completedOrder.items && Array.isArray(completedOrder.items)) {
      completedOrder.items = completedOrder.items.map(item => {
        if (typeof item === 'string') {
          return { name: item, quantity: 1 };
        } else if (typeof item === 'object' && item !== null) {
          return {
            name: item.name || '',
            quantity: item.quantity || 1
          };
        }
        return item;
      });
    }

    completedOrdersData.completedOrders.push(completedOrder);
    ordersData.orders.splice(orderIndex, 1);

    fs.writeFileSync(ordersFile, JSON.stringify(ordersData, null, 2));
    fs.writeFileSync(completedOrdersFile, JSON.stringify(completedOrdersData, null, 2));

    // Update bestseller data whenever an order is completed
    updateBestsellerData();

    res.json({ message: 'Order completed successfully' });
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ error: 'Failed to complete order' });
  }
};

// Cancel order
const cancelOrder: RequestHandler = (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const ordersData = readOrders();
    const orderIndex = ordersData.orders.findIndex((order: Order) => order.id === orderId);
    
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    ordersData.orders.splice(orderIndex, 1);
    fs.writeFileSync(ordersFile, JSON.stringify(ordersData, null, 2));

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
};

// Delete completed order
const deleteCompletedOrder: RequestHandler = (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const completedOrdersData = readCompletedOrders();
    const orderIndex = completedOrdersData.completedOrders.findIndex((order: CompletedOrder) => order.id === orderId);
    
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Completed order not found' });
      return;
    }

    completedOrdersData.completedOrders.splice(orderIndex, 1);
    fs.writeFileSync(completedOrdersFile, JSON.stringify(completedOrdersData, null, 2));

    // Update bestseller data whenever a completed order is deleted
    updateBestsellerData();

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};

// Routes
router.post("/", createOrder);
router.get("/", getOrders);
router.post("/complete", completeOrder);
router.delete("/cancel", cancelOrder);
router.delete("/delete-completed", deleteCompletedOrder);
router.post("/delete-completed", deleteCompletedOrder);
router.get("/delete-completed", (req, res) => {
  res.status(405).json({ error: 'Method not allowed. Use DELETE /delete-completed instead.' });
});

export default router;
