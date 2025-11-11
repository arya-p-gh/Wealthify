const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const jwt = require('jsonwebtoken');
const User = require('./models/User');

// CORS: allow local dev and configured client origin (for Vercel)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Log origin for debugging (will be quiet in production logs)
      if (process.env.NODE_ENV !== 'production') console.log('🔍 CORS request from origin:', origin);

      // Allow requests with no origin (curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow localhost during development
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }

      // Allow Render preview and hosted origins (onrender.com)
      if (origin.includes('.onrender.com')) {
        return callback(null, true);
      }

      // Allow explicit configured origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Otherwise block
      console.log('❌ CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

app.use('/api/auth', require('./routes/auth'));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.json({ message: 'Wealthify API is running!' });
});

// Simple token auth middleware for protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Protected endpoint to return the current user
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId, { password: 0 }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
