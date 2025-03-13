import express, { Request, Response, Router, RequestHandler } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Serve static files from the uploads directory
router.use(
  "/images",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

// Adjust the path to be relative to the project root
const DATA_FILE = path.join(__dirname, "..", "data", "menu.json");

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

interface CategoryUpdateBody {
  category: Category;
  oldCategoryName: string;
}

type TypedRequestHandler<P, ResBody, ReqBody> = (
  req: Request<P, ResBody, ReqBody>,
  res: Response<ResBody>
) => Promise<void> | void;

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
      lastUpdated: new Date().toISOString(),
    };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Load menu data
async function loadMenuData(): Promise<MenuData> {
  try {
    await ensureDataDirectory();
    await initializeDataFile();

    const rawData = await fs.readFile(DATA_FILE, "utf-8");
    let data: MenuData;

    try {
      data = JSON.parse(rawData);
    } catch (parseError) {
      console.error("Error parsing menu data:", parseError);
      // Initialize with empty data if parsing fails
      data = {
        items: [],
        categories: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Validate and clean the data
    return {
      items: (data.items || []).map((item) => ({
        id: String(item.id || ""),
        name: String(item.name || ""),
        price: Number(item.price || 0),
        category: String(item.category || ""),
        categoryOrder: String(item.categoryOrder || ""),
        description: String(item.description || ""),
        image: String(item.image || "blank.png"),
        isAvailable: Boolean(item.isAvailable ?? true),
        itemOrder: Number(item.itemOrder || 0),
      })),
      categories: (data.categories || []).map((category) => ({
        id: String(category.id || ""),
        name: String(category.name || ""),
        order: Number(category.order || 0),
      })),
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error loading menu data:", error);
    throw error;
  }
}

// Save menu data
async function saveMenuData(data: MenuData): Promise<void> {
  try {
    await ensureDataDirectory();
    // Validate the data structure before saving
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid items data");
    }
    if (!data.categories || !Array.isArray(data.categories)) {
      throw new Error("Invalid categories data");
    }

    // Ensure all required fields are present
    data.items = data.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      category: item.category,
      categoryOrder: item.categoryOrder,
      description: item.description || "",
      image: item.image || "blank.png",
      isAvailable: item.isAvailable ?? true,
      itemOrder: Number(item.itemOrder),
    }));

    data.categories = data.categories.map((category) => ({
      id: category.id,
      name: category.name,
      order: Number(category.order),
    }));

    // Update lastUpdated timestamp
    data.lastUpdated = new Date().toISOString();

    // Save with proper formatting
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving menu data:", error);
    throw error;
  }
}

// Get menu data
router.get("/get-menu", async (req: Request, res: Response) => {
  try {
    console.log("Loading menu data...");
    const data = await loadMenuData();
    res.json(data);
  } catch (error) {
    console.error("Error loading menu data:", error);
    res.status(500).json({ error: "Failed to load menu data" });
  }
});

// Get menu data
router.get("/", async (req: Request, res: Response) => {
  try {
    console.log("Loading menu data...");
    const data = await loadMenuData();
    console.log("Menu data loaded:", data);
    res.json(data);
  } catch (error) {
    console.error("Error loading menu data:", error);
    res.status(500).json({ error: "Failed to load menu data" });
  }
});

// Update menu data
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, categories } = req.body;
    const menuData = {
      items,
      categories,
      lastUpdated: new Date().toISOString(),
    };

    // Validate the menu data structure
    if (!Array.isArray(items) || !Array.isArray(categories)) {
      res.status(400).json({ error: "Invalid menu data structure" });
      return;
    }

    // Ensure each item has required fields
    for (const item of items) {
      if (
        !item.id ||
        !item.name ||
        typeof item.price !== "number" ||
        !item.category
      ) {
        res.status(400).json({ error: "Invalid item data" });
        return;
      }
    }

    // Ensure each category has required fields
    for (const category of categories) {
      if (
        !category.name ||
        !category.id ||
        typeof category.order !== "number"
      ) {
        res.status(400).json({ error: "Invalid category data" });
        return;
      }
    }

    // Write the menu data to file
    await saveMenuData(menuData);

    res.json({ message: "Menu updated successfully" });
  } catch (error) {
    console.error("Error updating menu:", error);
    res.status(500).json({ error: "Failed to update menu" });
  }
});

// Add menu item
router.post("/items", async (req: Request, res: Response) => {
  try {
    console.log("Adding menu item:", req.body);
    const data = await loadMenuData();
    const newItem: MenuItem = {
      ...req.body,
      id: Date.now().toString(),
      itemOrder: data.items.filter(
        (item) => item.category === req.body.category
      ).length,
    };
    data.items.push(newItem);
    await saveMenuData(data);
    console.log("Menu item added successfully:", newItem);
    res.json(newItem);
  } catch (error) {
    console.error("Error adding menu item:", error);
    res.status(500).json({ error: "Failed to add menu item" });
  }
});

// Update menu item
router.put("/items/:id", async (req: Request<ItemParams>, res: Response) => {
  try {
    console.log("Updating menu item:", req.params.id, req.body);
    const data = await loadMenuData();
    const index = data.items.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const updatedItem: MenuItem = { ...req.body, id: req.params.id };
    data.items[index] = updatedItem;
    await saveMenuData(data);
    console.log("Menu item updated successfully:", updatedItem);
    res.json(updatedItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

// Delete menu item
router.delete("/items/:id", async (req: Request<ItemParams>, res: Response) => {
  try {
    console.log("Deleting menu item:", req.params.id);
    const data = await loadMenuData();
    data.items = data.items.filter((item) => item.id !== req.params.id);
    await saveMenuData(data);
    console.log("Menu item deleted successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

// Add category
router.post("/categories", async (req: Request, res: Response) => {
  try {
    console.log("Adding category:", req.body);
    const data = await loadMenuData();
    const newCategory: Category = {
      ...req.body,
      id: Date.now().toString(),
      order: data.categories.length,
    };
    data.categories.push(newCategory);
    await saveMenuData(data);
    console.log("Category added successfully:", newCategory);
    res.json(newCategory);
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ error: "Failed to add category" });
  }
});

// Update category
router.put("/categories/:id", (async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Request<CategoryParams, any, CategoryUpdateBody>,
  res: Response
) => {
  try {
    console.log("Updating category:", req.params.id, req.body);
    const data = await loadMenuData();

    // Find the category to update
    const categoryIndex = data.categories.findIndex(
      (cat) => cat.id === req.params.id
    );
    if (categoryIndex === -1) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    // Validate request body
    if (!req.body || !req.body.category || !req.body.oldCategoryName) {
      res.status(400).json({
        error:
          "Invalid request body. Must include category and oldCategoryName.",
      });
      return;
    }

    const { category: updatedCategory, oldCategoryName } = req.body;

    // Update the category
    data.categories[categoryIndex] = {
      ...data.categories[categoryIndex],
      name: updatedCategory.name,
      order: updatedCategory.order ?? data.categories[categoryIndex].order,
    };

    // Update all items that reference this category
    data.items = data.items.map((item) => {
      if (item.category === oldCategoryName) {
        console.log(
          `Updating item ${item.name} from category ${oldCategoryName} to ${updatedCategory.name}`
        );
        return {
          ...item,
          category: updatedCategory.name,
          categoryOrder: updatedCategory.name, // Update categoryOrder as well to maintain consistency
        };
      }
      return item;
    });

    console.log("Updated data:", data);
    await saveMenuData(data);
    res.json(data.categories[categoryIndex]);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
}) as RequestHandler<CategoryParams, any, CategoryUpdateBody>);

// Delete category
router.delete(
  "/categories/:id",
  async (req: Request<CategoryParams>, res: Response) => {
    try {
      console.log("Deleting category:", req.params.id);
      const data = await loadMenuData();
      data.categories = data.categories.filter(
        (cat) => cat.id !== req.params.id
      );
      await saveMenuData(data);
      console.log("Category deleted successfully");
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
);

// Create upload directory path - ensure it's relative to project root
const uploadDir = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
async function ensureUploadDirectory() {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
}

// Initialize directories
ensureUploadDirectory().catch((error) => {
  console.error("Error creating upload directory:", error);
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Get file extension
    const ext = path.extname(file.originalname).toLowerCase();
    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only images
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WEBP) are allowed"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
}).single("image");

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Upload image endpoint
router.post("/upload-image", (req: MulterRequest, res: Response) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      res.status(400).json({ error: err.message });
      return;
    } else if (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message });
      return;
    }

    console.log("Upload request received");

    if (!req.file) {
      console.log("No file in request");
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    console.log("File details:", {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Return path relative to public directory for client access
    const publicPath = `/uploads/${req.file.filename}`;

    console.log("Image uploaded successfully:", {
      originalName: req.file.originalname,
      filename: req.file.filename,
      publicPath,
    });

    res.json({
      imagePath: publicPath,
      message: "Image uploaded successfully",
    });
  });
});

export default router;
