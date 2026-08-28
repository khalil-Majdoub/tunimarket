// backend/server.js
require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const cloudinary = require('cloudinary').v2;

// ── Validate required env vars at startup ─────────────────────────────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing      = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[Server] FATAL: Missing env variables: ${missing.join(', ')}`);
  process.exit(1);
}

// Not fatal on its own — only Google login needs it. Warn instead of exiting
// so the rest of the app still works if you haven't set this up yet.
if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn('[Server] ⚠️ GOOGLE_CLIENT_ID not set — Google login will fail until it is.');
}

// ── Cloudinary configuration ──────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => console.warn('[MongoDB] Disconnected'));
mongoose.connection.on('reconnected',  () => console.log('[MongoDB] Reconnected'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/auth',     require('./routes/googleAuth')); // ← NEW: adds POST /api/auth/google
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/seller',   require('./routes/seller'));
app.use('/api/sellers',  require('./routes/sellerProfile'));
app.use('/api/contact',  require('./routes/contact'));     // ← NEW: real contact form submission

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', time: new Date().toISOString(), env: process.env.NODE_ENV || 'development' })
);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} introuvable` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  const status  = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'Erreur serveur interne'
    : err.message || 'Erreur serveur';
  res.status(status).json({ message });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   NODE_ENV : ${process.env.NODE_ENV || 'development'}`);
});