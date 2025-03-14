import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import menuApi from "./menuApi.js";
import ordersApi from "./ordersApi.js";
import bestsellerApi from "./bestsellerApi.js";
import { initializeFileWatcher } from "../data/bestsellerData";
import os from 'os';

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
      // Allow connections from any origin when in development
      /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
      /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
      /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
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

// Add a route handler for the root path
app.get("/", (req, res) => {
  res.send("Smart Restaurant Digital Ordering and QR Code System API Server is running!");
});

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

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Local: http://localhost:${port}`);
  
  // Get network interfaces to display IP addresses
  try {
    const nets = os.networkInterfaces();
    const results = Object.create(null);
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
          console.log(`Network: http://${net.address}:${port}`);
        }
      }
    }
  } catch (error) {
    console.log('Could not determine network interfaces:', error);
  }
});
