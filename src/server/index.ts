import express from 'express';
import cors from 'cors';
import menuApi from './menuApi';

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies with a larger limit
app.use(express.json({ limit: '10mb' }));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Use menu API routes
app.use('/api/menu', menuApi);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
