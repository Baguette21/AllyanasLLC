import express, { Request, Response, NextFunction, RequestHandler } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const DATA_FILE = path.join(process.cwd(), "src", "data", "menu.json");

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  itemOrder: number;
  categoryOrder: number;
  isBestseller: boolean;
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

interface MenuParams {
  id: string;
}

// Load menu data
const loadMenuData = (): MenuData => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initialData: MenuData = {
        items: [],
        categories: [],
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }

    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const data = JSON.parse(rawData);
    return {
      items: data.items || [],
      categories: data.categories || [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error loading menu data:", error);
    throw error;
  }
};

// Save menu data
const saveMenuData = (data: MenuData): void => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving menu data:", error);
    throw error;
  }
};

// Get menu data
const getMenu: RequestHandler = (_req, res) => {
  try {
    const data = loadMenuData();
    res.json(data);
  } catch (error) {
    console.error("Error loading menu data:", error);
    res.status(500).json({ error: "Failed to load menu data" });
  }
};

// Update menu data
const updateMenu: RequestHandler = async (req, res) => {
  try {
    const { items, categories } = req.body;
    const menuData = await loadMenuData();

    // Update items with new order
    if (items) {
      const updatedItems = items.map((item) => ({
        ...item,
        itemOrder: item.itemOrder || 0,
      }));
      menuData.items = updatedItems;
    }

    // Update categories with new order
    if (categories) {
      const updatedCategories = categories.map((category) => ({
        ...category,
        order: category.order || 0,
      }));
      menuData.categories = updatedCategories;
    }

    menuData.lastUpdated = new Date().toISOString();
    await saveMenuData(menuData);
    res.json(menuData);
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({ error: "Failed to update menu" });
  }
};

// Add menu item
const addMenuItem: RequestHandler = (req, res) => {
  try {
    const data = loadMenuData();
    const category = data.categories.find((c) => c.name === req.body.category);
    const newItem: MenuItem = {
      ...req.body,
      id: Date.now().toString(),
      categoryOrder: category?.order || 0,
      itemOrder: data.items.filter(
        (item) => item.category === req.body.category
      ).length,
      isBestseller: false // Default value for all new items
    };
    data.items.push(newItem);
    saveMenuData(data);
    res.json(newItem);
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({ error: "Failed to add menu item" });
  }
};

// Update menu item
const updateMenuItem: RequestHandler<MenuParams> = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = req.body;
    const menuData = await loadMenuData();

    const index = menuData.items.findIndex((item) => item.id === id);
    if (index === -1) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    // Preserve the item order if not specified
    menuData.items[index] = {
      ...menuData.items[index],
      ...updatedItem,
      itemOrder: updatedItem.itemOrder ?? menuData.items[index].itemOrder,
    };

    await saveMenuData(menuData);
    res.json(menuData.items[index]);
    return;
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: "Failed to update menu item" });
    return;
  }
};

// Delete menu item
const deleteMenuItem: RequestHandler<MenuParams> = (req, res) => {
  try {
    const data = loadMenuData();
    data.items = data.items.filter((item) => item.id !== req.params.id);
    saveMenuData(data);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
};

// Add category
const addCategory: RequestHandler = (req, res) => {
  try {
    const data = loadMenuData();
    const newCategory: Category = {
      ...req.body,
      id: Date.now().toString(),
      order: data.categories.length,
    };
    data.categories.push(newCategory);

    // Update all items with this category to have the correct order
    data.items = data.items.map((item) => {
      if (item.category === newCategory.name) {
        return { ...item, categoryOrder: newCategory.order };
      }
      return item;
    });

    saveMenuData(data);
    res.json(newCategory);
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: "Failed to add category" });
  }
};

// Update category
const updateCategory: RequestHandler<MenuParams> = (req, res) => {
  try {
    const data = loadMenuData();
    const categoryIndex = data.categories.findIndex(
      (cat) => cat.id === req.params.id
    );
    if (categoryIndex === -1) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const oldCategory = data.categories[categoryIndex];
    const newCategory = { ...req.body.category, id: req.params.id };
    data.categories[categoryIndex] = newCategory;

    // Update all affected items
    data.items = data.items.map((item) => {
      if (item.category === req.body.oldCategoryName) {
        return {
          ...item,
          category: newCategory.name,
          categoryOrder: newCategory.order,
        };
      }
      return item;
    });

    saveMenuData(data);
    res.json(newCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

// Delete category
const deleteCategory: RequestHandler<MenuParams> = (req, res) => {
  try {
    const data = loadMenuData();
    data.categories = data.categories.filter((cat) => cat.id !== req.params.id);
    saveMenuData(data);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

// Update entire menu data
const updateMenuData: RequestHandler = (req, res) => {
  try {
    const menuData = req.body;
    
    if (!menuData || !menuData.items || !Array.isArray(menuData.items)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid menu data format' 
      });
      return;
    }
    
    // Update lastUpdated timestamp
    menuData.lastUpdated = new Date().toISOString();
    
    // Save the updated menu data
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(menuData, null, 2), 'utf8');
      console.log("Menu data updated successfully");
      res.json({ 
        success: true, 
        message: 'Menu data updated successfully' 
      });
    } catch (error) {
      console.error("Error writing to menu file:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update menu data' 
      });
    }
  } catch (error) {
    console.error("Error updating menu data:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update menu data' 
    });
  }
};

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
}).single("image");

// Upload image endpoint
const uploadImage: RequestHandler = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: "File upload error" });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
    });
  });
};

// Route handlers
router.get("/", getMenu);
router.post("/", updateMenu);
router.post("/update", updateMenuData);
router.post("/items", addMenuItem);
router.put("/items/:id", updateMenuItem);
router.delete("/items/:id", deleteMenuItem);
router.post("/categories", addCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);
router.post("/upload-image", uploadImage);

export default router;
