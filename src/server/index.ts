import express from 'express';
import cors from 'cors';
import path from 'path';
import menuApi from './menuApi';

const app = express();
const port = 3001;

// Enable CORS for all routes with specific configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON bodies with a larger limit
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies (for form data)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Use menu API routes
app.use('/api/menu', menuApi);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
