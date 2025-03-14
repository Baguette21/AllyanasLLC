import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define interfaces for our data structures
interface MenuItem {
  id: string;
  name: string;
}

interface BestsellerItem {
  id: string;
  name: string;
  quantity: number;
}

interface BestsellerData {
  items: BestsellerItem[];
  lastUpdated: string;
}

// Completed order can have items in different formats
interface CompletedOrder {
  id: string;
  items: Array<string | { id: string; name: string; quantity: number }>;
  timeCompleted?: string;
  completedTime?: string;
}

interface CompletedOrdersData {
  completedOrders: CompletedOrder[];
}

interface MenuData {
  items: MenuItem[];
}

// File paths - using relative paths from this file
const MENU_FILE = path.join(__dirname, 'menu.json');
const COMPLETED_ORDERS_FILE = path.join(__dirname, 'completedOrders.json');
const BESTSELLER_FILE = path.join(__dirname, 'bestseller.json');

// Load data from a JSON file
const loadJsonData = <T>(filePath: string, defaultData: T): T => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
};

// Save data to a JSON file
const saveJsonData = <T>(filePath: string, data: T): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    throw error;
  }
};

// Update bestseller data based on completed orders
export const updateBestsellerData = (): void => {
  try {
    // Load data
    const menuData = loadJsonData<MenuData>(MENU_FILE, { items: [] });
    const completedOrdersData = loadJsonData<CompletedOrdersData>(COMPLETED_ORDERS_FILE, { completedOrders: [] });
    
    console.log('Menu items loaded:', menuData.items.length);
    console.log('Completed orders loaded:', completedOrdersData.completedOrders.length);
    
    // Create a map of item names to IDs for quick lookup
    const itemNameToIdMap = new Map<string, string>();
    menuData.items.forEach(item => {
      itemNameToIdMap.set(item.name, item.id);
    });
    
    // Initialize bestseller data with menu items
    const bestsellerData: BestsellerData = {
      items: menuData.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: 0
      })),
      lastUpdated: new Date().toISOString()
    };

    // Process completed orders
    completedOrdersData.completedOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(orderItem => {
          // Handle different item formats
          if (typeof orderItem === 'string') {
            // Item is just a string (name)
            const itemName = orderItem;
            const itemId = itemNameToIdMap.get(itemName);
            
            if (itemId) {
              const bestsellerItem = bestsellerData.items.find(item => item.id === itemId);
              if (bestsellerItem) {
                bestsellerItem.quantity += 1; // Default quantity is 1
                console.log(`Incremented count for ${itemName} (${itemId}) by 1`);
              }
            }
          } else if (typeof orderItem === 'object' && orderItem !== null) {
            // Item is an OrderItem object with name and quantity
            const itemName = 'name' in orderItem ? orderItem.name : '';
            const quantity = 'quantity' in orderItem ? orderItem.quantity : 1;
            
            if (itemName) {
              const itemId = itemNameToIdMap.get(itemName);
              
              if (itemId) {
                const bestsellerItem = bestsellerData.items.find(item => item.id === itemId);
                if (bestsellerItem) {
                  bestsellerItem.quantity += quantity;
                  console.log(`Incremented count for ${itemName} (${itemId}) by ${quantity}`);
                }
              }
            }
          }
        });
      }
    });

    // Sort by quantity
    bestsellerData.items.sort((a, b) => b.quantity - a.quantity);
    
    // Save updated data
    saveJsonData(BESTSELLER_FILE, bestsellerData);
    console.log('Bestseller data updated successfully');
    
    // Log the top 5 bestsellers for debugging
    const top5 = bestsellerData.items.slice(0, 5);
    console.log('Top 5 bestsellers:');
    top5.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - ${item.quantity} sold`);
    });
    
  } catch (error) {
    console.error('Error updating bestseller data:', error);
  }
};

// Get bestseller data
export const getBestsellerData = (): BestsellerData => {
  return loadJsonData<BestsellerData>(BESTSELLER_FILE, { items: [], lastUpdated: new Date().toISOString() });
};

// Check if an item is a bestseller (top 5)
export const isBestseller = (itemId: string): boolean => {
  const data = getBestsellerData();
  const topItems = data.items.slice(0, 5);
  return topItems.some(item => item.id === itemId);
};

// Force an immediate update of the bestseller data
export const forceUpdateBestsellerData = (): void => {
  console.log('Forcing bestseller data update...');
  updateBestsellerData();
};

// Set up a file watcher to monitor completedOrders.json for changes
let watcherInitialized = false;
export const initializeFileWatcher = (): void => {
  if (watcherInitialized) return;
  
  try {
    console.log('Setting up file watcher for completedOrders.json...');
    
    // Create the bestseller.json file if it doesn't exist
    if (!fs.existsSync(BESTSELLER_FILE)) {
      updateBestsellerData();
    } else {
      // Force an update on initialization
      forceUpdateBestsellerData();
    }
    
    // Watch for changes to completedOrders.json
    fs.watch(COMPLETED_ORDERS_FILE, (eventType, filename) => {
      if (eventType === 'change' && filename) {
        console.log(`Detected change in ${filename}, updating bestseller data...`);
        // Add a small delay to ensure the file is fully written
        setTimeout(() => {
          updateBestsellerData();
        }, 500);
      }
    });
    
    watcherInitialized = true;
    console.log('File watcher initialized successfully');
  } catch (error) {
    console.error('Error initializing file watcher:', error);
  }
};

// Initialize the watcher when this module is imported
initializeFileWatcher();
