const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');

// Read the CSV file
const csvData = fs.readFileSync(path.join(__dirname, '../Menu/MENU.CSV'), 'utf-8');
const records = csv.parse(csvData, {
  columns: true,
  skip_empty_lines: true
});

// Get unique categories
const categories = [...new Set(records.map(record => record.category))];

// Create category objects
const categoryObjects = categories.map((category, index) => ({
  name: category.toLowerCase(),
  id: `${Date.now()}${index}`,
  order: index
}));

// Create menu items
const items = records.map((record, index) => {
  const categoryObj = categoryObjects.find(cat => cat.name === record.category.toLowerCase());
  return {
    id: `${Date.now()}${index + categories.length}`,
    name: record.item_name,
    price: parseFloat(record.price),
    category: categoryObj.name,
    categoryOrder: categoryObj.name,
    description: record.description,
    image: 'blank.png',
    isAvailable: true,
    itemOrder: index
  };
});

// Create the final menu data
const menuData = {
  items,
  categories: categoryObjects,
  lastUpdated: new Date().toISOString()
};

// Write to menu.json
fs.writeFileSync(
  path.join(__dirname, '../data/menu.json'),
  JSON.stringify(menuData, null, 2),
  'utf-8'
);

console.log('Menu data has been imported successfully!');
