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
const paidOrdersFile = path.join(__dirname, "..", "data", "paidorders.json");

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

// Helper to read paid orders
const readPaidOrders = () => {
  try {
    if (!fs.existsSync(paidOrdersFile)) {
      const initialData = { paidOrders: [] };
      fs.writeFileSync(paidOrdersFile, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(paidOrdersFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading paid orders:", error);
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
    const paidData = readPaidOrders();
    res.json({ 
      orders: data.orders,
      completedOrders: completedData.completedOrders,
      paidOrders: paidData.paidOrders
    });
  } catch (error) {
    console.error("Error reading orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// Mark order as paid
const markOrderAsPaid: RequestHandler = (req, res) => {
  try {
    console.log('Mark order as paid request:', req.body);
    const { orderId } = req.body;
    if (!orderId) {
      console.log('No orderId provided');
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const ordersData = readOrders();
    const paidOrdersData = readPaidOrders();
    
    console.log('Current orders:', ordersData.orders.map(o => o.id));
    const orderIndex = ordersData.orders.findIndex((order: Order) => order.id === orderId);
    if (orderIndex === -1) {
      console.log('Order not found:', orderId);
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Create a deep copy of the order to avoid reference issues
    const orderToPay = JSON.parse(JSON.stringify(ordersData.orders[orderIndex]));
    
    // Create paid order with payment information
    const paidOrder = {
      ...orderToPay,
      isPaid: true,
      status: 'paid',
      paidAt: new Date().toISOString()
    };

    // Ensure each item has proper name and quantity properties
    if (paidOrder.items && Array.isArray(paidOrder.items)) {
      paidOrder.items = paidOrder.items.map(item => {
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

    paidOrdersData.paidOrders.push(paidOrder);
    ordersData.orders.splice(orderIndex, 1);

    fs.writeFileSync(ordersFile, JSON.stringify(ordersData, null, 2));
    fs.writeFileSync(paidOrdersFile, JSON.stringify(paidOrdersData, null, 2));

    console.log('Order marked as paid successfully:', orderId);
    res.json({ message: 'Order marked as paid successfully' });
  } catch (error) {
    console.error('Error marking order as paid:', error);
    res.status(500).json({ error: 'Failed to mark order as paid' });
  }
};

// Complete order (from paid orders)
const completeOrder: RequestHandler = (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const paidOrdersData = readPaidOrders();
    const completedOrdersData = readCompletedOrders();
    
    const orderIndex = paidOrdersData.paidOrders.findIndex((order: any) => order.id === orderId);
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Paid order not found' });
      return;
    }

    // Create a deep copy of the order to avoid reference issues
    const orderToComplete = JSON.parse(JSON.stringify(paidOrdersData.paidOrders[orderIndex]));
    
    // Ensure items are stored with their quantities
    const completedOrder: CompletedOrder = {
      ...orderToComplete,
      timeCompleted: new Date().toISOString(),
      completedAt: new Date().toISOString()
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
    paidOrdersData.paidOrders.splice(orderIndex, 1);

    fs.writeFileSync(paidOrdersFile, JSON.stringify(paidOrdersData, null, 2));
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

// Mark paid order as unpaid (move back to orders)
const markOrderAsUnpaid: RequestHandler = (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const paidOrdersData = readPaidOrders();
    const ordersData = readOrders();
    
    const orderIndex = paidOrdersData.paidOrders.findIndex((order: any) => order.id === orderId);
    if (orderIndex === -1) {
      res.status(404).json({ error: 'Paid order not found' });
      return;
    }

    // Create a deep copy of the order to avoid reference issues
    const orderToUnpay = JSON.parse(JSON.stringify(paidOrdersData.paidOrders[orderIndex]));
    
    // Remove payment information
    delete orderToUnpay.isPaid;
    delete orderToUnpay.status;
    delete orderToUnpay.paidAt;

    // Ensure each item has proper name and quantity properties
    if (orderToUnpay.items && Array.isArray(orderToUnpay.items)) {
      orderToUnpay.items = orderToUnpay.items.map(item => {
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

    ordersData.orders.push(orderToUnpay);
    paidOrdersData.paidOrders.splice(orderIndex, 1);

    fs.writeFileSync(ordersFile, JSON.stringify(ordersData, null, 2));
    fs.writeFileSync(paidOrdersFile, JSON.stringify(paidOrdersData, null, 2));

    res.json({ message: 'Order marked as unpaid successfully' });
  } catch (error) {
    console.error('Error marking order as unpaid:', error);
    res.status(500).json({ error: 'Failed to mark order as unpaid' });
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
router.post("/mark-paid", markOrderAsPaid);
router.post("/mark-unpaid", markOrderAsUnpaid);
router.post("/complete", completeOrder);
router.delete("/cancel", cancelOrder);
router.delete("/delete-completed", deleteCompletedOrder);
router.post("/delete-completed", deleteCompletedOrder);
router.get("/delete-completed", (req, res) => {
  res.status(405).json({ error: 'Method not allowed. Use DELETE /delete-completed instead.' });
});

export default router;
