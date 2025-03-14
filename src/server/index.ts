import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import menuApi from "./menuApi.js";
import ordersApi from "./ordersApi.js";
import bestsellerApi from "./bestsellerApi.js";
import { initializeFileWatcher } from "../data/bestsellerData";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Enable CORS for all routes with specific configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost:8081",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Parse JSON bodies with a larger limit
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from public directory
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"))
);

// Use API routes
app.use("/api/menu", menuApi);
app.use("/api/orders", ordersApi);
app.use("/api/bestseller", bestsellerApi);

// Initialize the bestseller data file watcher
initializeFileWatcher();
console.log("Bestseller data file watcher initialized");

// Error handling middleware
app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
