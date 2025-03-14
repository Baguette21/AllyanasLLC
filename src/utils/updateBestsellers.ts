// Script to update bestseller data from completed orders
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define file paths using server-side paths
const getFilePaths = () => {
  try {
    // Get the project root directory
    const projectRoot = process.cwd();
    
    // Define absolute paths to data files
    const MENU_FILE = path.resolve(projectRoot, 'src', 'data', 'menu.json');
    const COMPLETED_ORDERS_FILE = path.resolve(projectRoot, 'src', 'data', 'completedOrders.json');
    const BESTSELLER_FILE = path.resolve(projectRoot, 'src', 'data', 'bestseller.json');
    
    console.log('Using absolute file paths:');
    console.log('MENU_FILE:', MENU_FILE);
    console.log('COMPLETED_ORDERS_FILE:', COMPLETED_ORDERS_FILE);
    console.log('BESTSELLER_FILE:', BESTSELLER_FILE);
    
    return { MENU_FILE, COMPLETED_ORDERS_FILE, BESTSELLER_FILE };
  } catch (error) {
    console.error('Error determining file paths:', error);
    throw error;
  }
};

// Types for the data structures
interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
}

interface MenuData {
  items: MenuItem[];
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

interface OrderItem {
  name: string;
  quantity: number;
}

interface CompletedOrder {
  id: string;
  orderType: string;
  customerName: string;
  table?: string | null;
  contactNumber?: string | null;
  timeOfOrder: string;
  timeCompleted: string;
  price: number;
  items: Array<string | OrderItem | any>;
  additionalInfo?: string;
}

interface CompletedOrdersData {
  completedOrders: CompletedOrder[];
}

// Helper function to read JSON file
const readJsonFile = <T>(filePath: string): T | null => {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
};

// Helper function to write JSON file
const writeJsonFile = (filePath: string, data: any): boolean => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully wrote to ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
};

// Update bestseller data based on completed orders
export const updateBestsellerData = (): BestsellerData | null => {
  try {
    const { MENU_FILE, COMPLETED_ORDERS_FILE, BESTSELLER_FILE } = getFilePaths();
    
    console.log('Starting bestseller data update...');
    console.log('Menu file:', MENU_FILE);
    console.log('Completed orders file:', COMPLETED_ORDERS_FILE);
    console.log('Bestseller file:', BESTSELLER_FILE);
    
    // Read menu data
    const menuData = readJsonFile<MenuData>(MENU_FILE);
    if (!menuData || !menuData.items) {
      throw new Error('Menu data not found or invalid');
    }
    
    // Read completed orders
    const completedOrdersData = readJsonFile<CompletedOrdersData>(COMPLETED_ORDERS_FILE);
    if (!completedOrdersData || !completedOrdersData.completedOrders) {
      throw new Error('Completed orders data not found or invalid');
    }
    
    console.log(`Menu items: ${menuData.items.length}, Completed orders: ${completedOrdersData.completedOrders.length}`);
    
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
            // Item is an object with name and quantity
            if ('name' in orderItem) {
              const itemName = orderItem.name as string;
              const itemId = itemNameToIdMap.get(itemName);
              const quantity = (orderItem.quantity as number) || 1;
              
              if (itemId) {
                const bestsellerItem = bestsellerData.items.find(item => item.id === itemId);
                if (bestsellerItem) {
                  bestsellerItem.quantity += quantity;
                  console.log(`Incremented count for ${itemName} (${itemId}) by ${quantity}`);
                }
              }
            } else if ('id' in orderItem) {
              // Item has direct ID reference
              const itemId = orderItem.id as string;
              const quantity = (orderItem.quantity as number) || 1;
              
              const bestsellerItem = bestsellerData.items.find(item => item.id === itemId);
              if (bestsellerItem) {
                bestsellerItem.quantity += quantity;
                console.log(`Incremented count for ${bestsellerItem.name} (${itemId}) by ${quantity}`);
              }
            }
          }
        });
      }
    });
    
    // Sort items by quantity
    bestsellerData.items.sort((a, b) => b.quantity - a.quantity);
    
    // Write updated data
    const success = writeJsonFile(BESTSELLER_FILE, bestsellerData);
    if (!success) {
      throw new Error('Failed to write bestseller data');
    }
    
    console.log('Bestseller data updated successfully');
    
    // Log the top 5 bestsellers
    const top5 = bestsellerData.items.slice(0, 5);
    console.log('Top 5 bestsellers:');
    top5.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} - ${item.quantity} sold`);
    });
    
    return bestsellerData;
  } catch (error) {
    console.error('Error updating bestseller data:', error);
    return null;
  }
};

// For direct execution via node
if (typeof require !== 'undefined' && require.main === module) {
  updateBestsellerData();
}
