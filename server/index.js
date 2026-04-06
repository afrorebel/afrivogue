// Load .env from server/ dir first, fall back to project root
require('dotenv').config({ path: `${__dirname}/.env` });
require('dotenv').config({ path: `${__dirname}/../.env` });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://afrivogue.com',
  'https://www.afrivogue.com',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing
app.use(express.json());

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: { error: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' // Only rate limit POST requests
});

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// Serve uploaded images as static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Auth routes with stricter rate limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));

// Other routes
app.use('/api/trends', require('./routes/trends'));
app.use('/api/editorials', require('./routes/editorials'));
app.use('/api/forecasts', require('./routes/forecasts'));
app.use('/api/trivia', require('./routes/trivia'));
app.use('/api/moodboard', require('./routes/moodboard'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/email', require('./routes/email'));
app.use('/api/segments', require('./routes/segments'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

// Generic REST table router — mounted LAST so named routes take priority
app.use('/api', require('./routes/rest'));

// ─── Serve React frontend (production) ───────────────────────────────────────
// In production (Hostinger), serve the built React app for all non-API routes
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AfriVogue server running on port ${PORT}`);
});

module.exports = app;
