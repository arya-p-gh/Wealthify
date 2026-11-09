// Wealthify market-data API.
// Public, read-only market data (quotes, charts, search, portfolio value replay).
// There are no accounts: each visitor's holdings, watchlist and goals live in
// their own browser, and are only sent here (symbols + quantities) to price them.

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173', process.env.CLIENT_ORIGIN].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl, configured origins, and Vercel previews
      if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) return cb(null, true);
      if (process.env.NODE_ENV !== 'production') return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '100kb' }));

app.use('/api/stocks', require('./routes/stocks'));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/', (req, res) => res.json({ message: 'Wealthify market data API is running' }));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Market data API on port ${PORT}`));
