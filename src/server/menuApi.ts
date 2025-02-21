import express, { Request, Response, Router, RequestHandler } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Adjust the path to be relative to the project root
const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'menu.json');

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryOrder: string;
  description: string;
  image: string;
  isAvailable: boolean;
  itemOrder: number;
}

interface Category {
  id: string;
  name: string;
  order: number;
}

interface MenuData {
  items: MenuItem[];
  categories: Category[];
  lastUpdated: string;
}

// Type definitions for route parameters
interface ItemParams {
  id: string;
}

interface CategoryParams {
  id: string;
}

// Ensure data directory exists
async function ensureDataDirectory() {
  const dir = path.dirname(DATA_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Initialize empty data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData: MenuData = {
      items: [],
      categories: [],
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Load menu data
async function loadMenuData(): Promise<MenuData> {
  await ensureDataDirectory();
  await initializeDataFile();
  const data = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(data);
}

// Save menu data
async function saveMenuData(data: MenuData): Promise<void> {
  await ensureDataDirectory();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get menu data
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Loading menu data...');
    const data = await loadMenuData();
    console.log('Menu data loaded:', data);
    res.json(data);
  } catch (error) {
    console.error('Error loading menu data:', error);
    res.status(500).json({ error: 'Failed to load menu data' });
  }
});

// Update menu data
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Saving menu data:', req.body);
    const currentData = await loadMenuData();
    const newData = {
      items: req.body.items || currentData.items,
      categories: req.body.categories || currentData.categories,
      lastUpdated: new Date().toISOString()
    };
    await saveMenuData(newData);
    console.log('Menu data saved successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving menu data:', error);
    res.status(500).json({ error: 'Failed to save menu data' });
  }
});

// Add menu item
router.post('/items', async (req: Request, res: Response) => {
  try {
    console.log('Adding menu item:', req.body);
    const data = await loadMenuData();
    const newItem: MenuItem = {
      ...req.body,
      id: Date.now().toString(),
      itemOrder: data.items.filter(item => item.category === req.body.category).length
    };
    data.items.push(newItem);
    await saveMenuData(data);
    console.log('Menu item added successfully:', newItem);
    res.json(newItem);
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// Update menu item
router.put('/items/:id', async (req: Request<ItemParams>, res: Response) => {
  try {
    console.log('Updating menu item:', req.params.id, req.body);
    const data = await loadMenuData();
    const index = data.items.findIndex(item => item.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    const updatedItem: MenuItem = { ...req.body, id: req.params.id };
    data.items[index] = updatedItem;
    await saveMenuData(data);
    console.log('Menu item updated successfully:', updatedItem);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item
router.delete('/items/:id', async (req: Request<ItemParams>, res: Response) => {
  try {
    console.log('Deleting menu item:', req.params.id);
    const data = await loadMenuData();
    data.items = data.items.filter(item => item.id !== req.params.id);
    await saveMenuData(data);
    console.log('Menu item deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Add category
router.post('/categories', async (req: Request, res: Response) => {
  try {
    console.log('Adding category:', req.body);
    const data = await loadMenuData();
    const newCategory: Category = {
      ...req.body,
      id: Date.now().toString(),
      order: data.categories.length
    };
    data.categories.push(newCategory);
    await saveMenuData(data);
    console.log('Category added successfully:', newCategory);
    res.json(newCategory);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// Update category
router.put('/categories/:id', async (req: Request<CategoryParams>, res: Response) => {
  try {
    console.log('Updating category:', req.params.id, req.body);
    const data = await loadMenuData();
    const index = data.categories.findIndex(cat => cat.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const updatedCategory: Category = { ...req.body, id: req.params.id };
    data.categories[index] = updatedCategory;
    await saveMenuData(data);
    console.log('Category updated successfully:', updatedCategory);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:id', async (req: Request<CategoryParams>, res: Response) => {
  try {
    console.log('Deleting category:', req.params.id);
    const data = await loadMenuData();
    data.categories = data.categories.filter(cat => cat.id !== req.params.id);
    await saveMenuData(data);
    console.log('Category deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
