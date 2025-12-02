const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const jwt = require('jsonwebtoken');
const User = require('./models/User');

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

if (process.env.NODE_ENV === 'production') {
  if (process.env.CLIENT_ORIGIN) {
    console.log('🔒 CLIENT_ORIGIN configured:', process.env.CLIENT_ORIGIN);
  } else {
    console.warn('⚠️ CLIENT_ORIGIN is NOT set. Server will temporarily allow .vercel.app origins until you set CLIENT_ORIGIN in Render. For production tighten this as soon as possible.');
  }
} else {
  console.log('🔍 CORS allowed origins (dev):', allowedOrigins);
}

app.use(
  cors({
    origin: true, 
    credentials: true,
  })
);

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/portfolio', require('./routes/portfolio'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/stocks', require('./routes/stocks'));



app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.json({ message: 'Wealthify API is running!' });
});

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
