const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS: allow local dev and configured client origin (for Vercel)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_ORIGIN, // e.g. https://your-frontend.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Log the origin for debugging
      console.log('🔍 CORS request from origin:', origin);
      
      // TEMPORARY: Allow all origins for testing
      // TODO: Remove this after Vercel deployment and add proper CLIENT_ORIGIN
      return callback(null, true);
      
      // Allow requests with no origin like mobile apps or curl
      if (!origin) return callback(null, true);
      
      // Allow any localhost in development
      if (process.env.NODE_ENV !== 'production' && origin && origin.includes('localhost')) {
        return callback(null, true);
      }
      
      // Allow Render preview/dashboard origins (they use .onrender.com)
      if (origin && origin.includes('.onrender.com')) {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
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

app.get('/', (req, res) => {
  res.json({ message: 'Wealthify API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
