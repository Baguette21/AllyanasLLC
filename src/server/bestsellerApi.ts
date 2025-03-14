import { Router, Request, Response, RequestHandler } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateBestsellerData as updateBestsellersUtil } from "../utils/updateBestsellers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Define file paths
const MENU_FILE = path.join(__dirname, "..", "data", "menu.json");
const COMPLETED_ORDERS_FILE = path.join(__dirname, "..", "data", "completedOrders.json");
const BESTSELLER_FILE = path.join(__dirname, "..", "data", "bestseller.json");

// Helper function to read JSON file
const readJsonFile = (filePath: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
};

// Helper function to write JSON file
const writeJsonFile = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
};

// Update bestseller data based on completed orders
export const updateBestsellerData = () => {
  try {
    // Read menu data
    const menuData = readJsonFile(MENU_FILE);
    if (!menuData || !menuData.items) {
      console.error("Menu data not found or invalid");
      return null;
    }
    
    // Read completed orders
    const completedOrdersData = readJsonFile(COMPLETED_ORDERS_FILE);
    if (!completedOrdersData || !completedOrdersData.completedOrders) {
      console.error("Completed orders data not found or invalid");
      return null;
    }
    
    console.log(`Menu items: ${menuData.items.length}, Completed orders: ${completedOrdersData.completedOrders.length}`);
    
    // Create a map of item names to IDs for quick lookup
    const itemNameToIdMap = new Map();
    menuData.items.forEach((item: any) => {
      itemNameToIdMap.set(item.name, item.id);
    });
    
    // Initialize bestseller data with menu items
    const bestsellerData = {
      items: menuData.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: 0
      })),
      lastUpdated: new Date().toISOString()
    };
    
    // Process completed orders
    let totalProcessedItems = 0;
    completedOrdersData.completedOrders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((orderItem: any) => {
          // Handle different item formats
          if (typeof orderItem === 'string') {
            // Item is just a string (name)
            const itemName = orderItem;
            const itemId = itemNameToIdMap.get(itemName);
            
            if (itemId) {
              const bestsellerItem = bestsellerData.items.find((item: any) => item.id === itemId);
              if (bestsellerItem) {
                bestsellerItem.quantity += 1; // Default quantity is 1
                totalProcessedItems++;
                console.log(`Incremented count for ${itemName} (${itemId}) by 1`);
              }
            }
          } else if (typeof orderItem === 'object' && orderItem !== null) {
            // Item is an object with name and quantity
            if ('name' in orderItem) {
              const itemName = orderItem.name;
              const itemId = itemNameToIdMap.get(itemName);
              const quantity = orderItem.quantity || 1;
              
              if (itemId) {
                const bestsellerItem = bestsellerData.items.find((item: any) => item.id === itemId);
                if (bestsellerItem) {
                  bestsellerItem.quantity += quantity;
                  totalProcessedItems++;
                  console.log(`Incremented count for ${itemName} (${itemId}) by ${quantity}`);
                }
              }
            } else if ('id' in orderItem) {
              // Item has direct ID reference
              const itemId = orderItem.id;
              const quantity = orderItem.quantity || 1;
              
              const bestsellerItem = bestsellerData.items.find((item: any) => item.id === itemId);
              if (bestsellerItem) {
                bestsellerItem.quantity += quantity;
                totalProcessedItems++;
                console.log(`Incremented count for ${bestsellerItem.name} (${itemId}) by ${quantity}`);
              }
            }
          }
        });
      }
    });
    
    // Sort items by quantity
    bestsellerData.items.sort((a: any, b: any) => b.quantity - a.quantity);
    
    // Write updated data
    const success = writeJsonFile(BESTSELLER_FILE, bestsellerData);
    if (!success) {
      console.error("Failed to write bestseller data");
      return null;
    }
    
    console.log(`Bestseller data updated successfully. Processed ${totalProcessedItems} items.`);
    return bestsellerData;
  } catch (error) {
    console.error("Error updating bestseller data:", error);
    return null;
  }
};

// Get all bestseller data
const getBestsellerData: RequestHandler = (req, res) => {
  try {
    const data = readJsonFile(BESTSELLER_FILE);
    if (!data) {
      res.status(404).json({ error: "Bestseller data not found" });
      return;
    }
    res.json(data);
  } catch (error) {
    console.error("Error getting bestseller data:", error);
    res.status(500).json({ error: "Failed to get bestseller data" });
  }
};

// Force update bestseller data
const updateBestsellerDataHandler: RequestHandler = (req, res) => {
  try {
    console.log("Starting bestseller data update from API endpoint...");
    
    // Define absolute file paths
    const MENU_FILE = path.resolve(__dirname, "..", "data", "menu.json");
    const COMPLETED_ORDERS_FILE = path.resolve(__dirname, "..", "data", "completedOrders.json");
    const BESTSELLER_FILE = path.resolve(__dirname, "..", "data", "bestseller.json");
    
    console.log("File paths:");
    console.log("MENU_FILE:", MENU_FILE);
    console.log("COMPLETED_ORDERS_FILE:", COMPLETED_ORDERS_FILE);
    console.log("BESTSELLER_FILE:", BESTSELLER_FILE);
    
    // Read menu data
    const menuData = readJsonFile(MENU_FILE);
    if (!menuData || !menuData.items) {
      console.error("Menu data not found or invalid");
      res.status(500).json({ 
        success: false, 
        message: 'Menu data not found or invalid' 
      });
      return;
    }
    
    // Read completed orders
    const completedOrdersData = readJsonFile(COMPLETED_ORDERS_FILE);
    if (!completedOrdersData || !completedOrdersData.completedOrders) {
      console.error("Completed orders data not found or invalid");
      res.status(500).json({ 
        success: false, 
        message: 'Completed orders data not found or invalid' 
      });
      return;
    }
    
    console.log(`Menu items: ${menuData.items.length}, Completed orders: ${completedOrdersData.completedOrders.length}`);
    
    // Create a map of item names to IDs for quick lookup
    const itemNameToIdMap = new Map();
    menuData.items.forEach((item: any) => {
      itemNameToIdMap.set(item.name, item.id);
    });
    
    // Initialize bestseller data with menu items
    const bestsellerData = {
      items: menuData.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: 0,
        category: item.category
      })),
      lastUpdated: new Date().toISOString()
    };
    
    // Process completed orders
    let totalProcessedItems = 0;
    completedOrdersData.completedOrders.forEach((order: any) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((orderItem: any) => {
          // Handle different item formats
          if (typeof orderItem === 'string') {
            // Item is just a string (name)
            const itemName = orderItem;
            const itemId = itemNameToIdMap.get(itemName);
            
            if (itemId) {
              const bestsellerItem = bestsellerData.items.find((item: any) => item.id === itemId);
              if (bestsellerItem) {
                bestsellerItem.quantity += 1; // Default quantity is 1
                totalProcessedItems++;
                console.log(`Incremented count for ${itemName} (${itemId}) by 1`);
              }
            }
          } else if (typeof orderItem === 'object' && orderItem !== null) {
            // Item is an object with name and quantity
            if ('name' in orderItem) {
              const itemName = orderItem.name;
              const itemId = itemNameToIdMap.get(itemName);
              const quantity = orderItem.quantity || 1;
              
              if (itemId) {
                const bestsellerItem = bestsellerData.items.find((item: any) => item.id === itemId);
                if (bestsellerItem) {
                  bestsellerItem.quantity += quantity;
                  totalProcessedItems++;
                  console.log(`Incremented count for ${itemName} (${itemId}) by ${quantity}`);
                }
              }
            } else if ('id' in orderItem) {
              // Item has direct ID reference
              const itemId = orderItem.id;
              const quantity = orderItem.quantity || 1;
              
              const bestsellerItem = bestsellerData.items.find((item: any) => item.id === itemId);
              if (bestsellerItem) {
                bestsellerItem.quantity += quantity;
                totalProcessedItems++;
                console.log(`Incremented count for ${bestsellerItem.name} (${itemId}) by ${quantity}`);
              }
            }
          }
        });
      }
    });
    
    // Sort items by quantity
    bestsellerData.items.sort((a: any, b: any) => b.quantity - a.quantity);
    
    // Write updated data
    const success = writeJsonFile(BESTSELLER_FILE, bestsellerData);
    if (!success) {
      console.error("Failed to write bestseller data");
      res.status(500).json({ 
        success: false, 
        message: 'Failed to write bestseller data' 
      });
      return;
    }
    
    console.log(`Bestseller data updated successfully. Processed ${totalProcessedItems} items.`);
    
    // Get top 5 non-drink bestsellers
    const nonDrinkItems = bestsellerData.items.filter((item: any) => 
      item.category !== "Drinks" && item.quantity > 0
    );
    const top5NonDrinkItems = nonDrinkItems.slice(0, 5);
    
    console.log("Top 5 non-drink bestsellers:");
    top5NonDrinkItems.forEach((item: any, index: number) => {
      console.log(`${index + 1}. ${item.name} - ${item.quantity} sold (${item.category})`);
    });
    
    // Update menu.json to add bestseller tags
    // First, set all items to non-bestseller
    menuData.items.forEach((item: any) => {
      item.isBestseller = false;
    });
    
    // Add bestseller tag to top 5 non-drink items
    const top5Names = top5NonDrinkItems.map((item: any) => item.name);
    console.log("Top 5 item names:", top5Names);
    
    let bestsellerCount = 0;
    menuData.items.forEach((item: any) => {
      if (top5Names.includes(item.name)) {
        item.isBestseller = true;
        bestsellerCount++;
        console.log(`Marked item as bestseller: ${item.name} (${item.id})`);
      }
    });
    
    console.log(`Marked ${bestsellerCount} items as bestsellers`);
    
    // Write updated menu data with direct fs.writeFileSync to ensure it works
    try {
      fs.writeFileSync(MENU_FILE, JSON.stringify(menuData, null, 2), 'utf8');
      console.log("Menu updated with bestseller tags successfully");
    } catch (error) {
      console.error("Error writing to menu file:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update menu data with bestseller tags' 
      });
      return;
    }
    
    // Return success response with top items
    res.json({ 
      success: true, 
      message: `Bestseller data updated successfully. Processed ${totalProcessedItems} items.`,
      topItems: top5NonDrinkItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category
      }))
    });
  } catch (error) {
    console.error("Error updating bestseller data:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update bestseller data' 
    });
  }
};

// Check if an item is a bestseller
const checkBestseller: RequestHandler = (req, res) => {
  try {
    const { itemId } = req.params;
    const data = readJsonFile(BESTSELLER_FILE);
    
    if (!data || !data.items) {
      res.status(404).json({ error: "Bestseller data not found" });
      return;
    }
    
    const topItems = data.items.slice(0, 5);
    const isBestseller = topItems.some((item: any) => item.id === itemId);
    
    res.json({ isBestseller });
  } catch (error) {
    console.error("Error checking bestseller status:", error);
    res.status(500).json({ error: "Failed to check bestseller status" });
  }
};

// Save bestseller data
const saveBestsellerDataHandler: RequestHandler = (req, res) => {
  try {
    const bestsellerData = req.body;
    
    if (!bestsellerData || !bestsellerData.items || !Array.isArray(bestsellerData.items)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid bestseller data format' 
      });
      return;
    }
    
    // Write bestseller data to file
    const success = writeJsonFile(BESTSELLER_FILE, bestsellerData);
    if (!success) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to save bestseller data' 
      });
      return;
    }
    
    res.json({ 
      success: true, 
      message: 'Bestseller data saved successfully' 
    });
  } catch (error) {
    console.error('Error saving bestseller data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save bestseller data' 
    });
  }
};

// Route handlers
router.get("/", getBestsellerData);
router.post("/update", updateBestsellerDataHandler);
router.post("/save", saveBestsellerDataHandler);
router.get("/check/:itemId", checkBestseller);

export default router;
