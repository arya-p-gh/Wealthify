# Wealthify Backend

Simple Node.js/Express API with MongoDB.

## Files:
- `server.js` - Main server file (Express setup, MongoDB connection)
- `models/User.js` - User database model (stores name, email, password)
- `routes/auth.js` - Login and Signup endpoints
- `.env` - Configuration (PORT, MONGODB_URI, JWT_SECRET)

## API Endpoints:
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/health` - Check if server is running

## To run:
```bash
npm run dev
```

Runs on http://localhost:5001
