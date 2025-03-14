import * as fs from 'fs';
import * as path from 'path';

// Define file paths
const MENU_FILE = path.resolve(__dirname, '..', 'src', 'data', 'menu.json');
const BESTSELLER_FILE = path.resolve(__dirname, '..', 'src', 'data', 'bestseller.json');

interface MenuItem {
  id: string;
  name: string;
  category?: string;
  isBestseller: boolean;
  [key: string]: any;
}

interface MenuData {
  items: MenuItem[];
  [key: string]: any;
}

interface BestsellerItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  [key: string]: any;
}

interface BestsellerData {
  items: BestsellerItem[];
  lastUpdated: string;
  [key: string]: any;
}

console.log('Starting bestseller tag update...');
console.log('Menu file:', MENU_FILE);
console.log('Bestseller file:', BESTSELLER_FILE);

// Read menu data
let menuData: MenuData;
try {
  menuData = JSON.parse(fs.readFileSync(MENU_FILE, 'utf8')) as MenuData;
  console.log(`Read menu data: ${menuData.items.length} items`);
} catch (error) {
  console.error('Error reading menu file:', error);
  process.exit(1);
}

// Read bestseller data
let bestsellerData: BestsellerData;
try {
  bestsellerData = JSON.parse(fs.readFileSync(BESTSELLER_FILE, 'utf8')) as BestsellerData;
  console.log(`Read bestseller data: ${bestsellerData.items.length} items`);
} catch (error) {
  console.error('Error reading bestseller file:', error);
  process.exit(1);
}

// Get top 5 non-drink bestsellers
const nonDrinkItems = bestsellerData.items.filter(item => 
  item.category !== "Drinks" && item.quantity > 0
);
const top5NonDrinkItems = nonDrinkItems.slice(0, 5);

console.log('Top 5 non-drink bestsellers:');
top5NonDrinkItems.forEach((item, index) => {
  console.log(`${index + 1}. ${item.name} - ${item.quantity} sold (${item.category || 'Unknown'})`);
});

// First, set all items to non-bestseller
menuData.items.forEach(item => {
  item.isBestseller = false;
});

// Add bestseller tag to top 5 non-drink items
const top5Names = top5NonDrinkItems.map(item => item.name);
console.log('Top 5 item names:', top5Names);

let bestsellerCount = 0;
menuData.items.forEach(item => {
  if (top5Names.includes(item.name)) {
    item.isBestseller = true;
    bestsellerCount++;
    console.log(`Marked item as bestseller: ${item.name} (${item.id})`);
  }
});

console.log(`Marked ${bestsellerCount} items as bestsellers`);

// Write updated menu data
try {
  fs.writeFileSync(MENU_FILE, JSON.stringify(menuData, null, 2), 'utf8');
  console.log('Menu updated with bestseller tags successfully');
} catch (error) {
  console.error('Error writing to menu file:', error);
  process.exit(1);
}

console.log('Bestseller tag update completed successfully!');
