# 🚀 Quick Start Guide for Wealthify

## What We've Built
✅ Complete Login/Signup system with JWT authentication
✅ Backend API with Express.js
✅ Frontend with React
✅ Password hashing and security

## Current Status
- **Backend**: Created and ready (needs MongoDB connection)
- **Frontend**: Created and ready to test
- **Database**: Needs MongoDB setup (in progress)

## Next Steps to Get Running:

### Step 1: Set Up MongoDB

You have 3 options:

#### Option A: MongoDB Atlas (Easiest - Recommended for deployment)
1. Go to https://mongodb.com/cloud/atlas/register
2. Create a FREE account
3. Create a new cluster (select FREE tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Update `backend/.env` file:
   ```
   MONGODB_URI=your_connection_string_here
   ```

#### Option B: Local MongoDB (Currently installing)
- MongoDB is being installed via Homebrew
- Once installed, start it with:
  ```bash
  brew services start mongodb-community@7.0
  ```
- Update `backend/.env`:
  ```
  MONGODB_URI=mongodb://localhost:27017/wealthify
  ```

#### Option C: Use Docker
```bash
docker run -d -p 27017:27017 --name wealthify-mongo mongo:latest
```

### Step 2: Start Backend Server

```bash
cd backend
npm run dev
```

Should see:
```
🚀 Server running on port 5001
✅ MongoDB Connected
```

### Step 3: Start Frontend

In a NEW terminal:
```bash
cd frontend
npm start
```

Browser will auto-open to `http://localhost:3000`

### Step 4: Test the App!

1. **Sign Up**:
   - Click "Sign up here"
   - Enter name, email, password
   - Click "Sign Up"
   - You'll be redirected to dashboard

2. **Login**:
   - Logout from dashboard
   - Enter your email and password
   - Click "Login"
   - You'll see your dashboard

## Troubleshooting

### Backend Issues
- **Port 5001 in use**: Change PORT in `.env` to 5002
- **MongoDB connection error**: Make sure MongoDB is running
- **"Cannot find module"**: Run `npm install` in backend folder

### Frontend Issues
- **Cannot reach backend**: Check backend is running on port 5001
- **CORS errors**: Backend has CORS enabled, should work
- **npm errors**: Try deleting `node_modules` and run `npm install`

## File Structure
```
wealthify/
├── backend/
│   ├── models/User.js       # User database model
│   ├── routes/auth.js       # Login/signup routes
│   ├── server.js            # Main server file
│   └── .env                 # Configuration
└── frontend/
    └── src/
        ├── components/
        │   ├── Login.js     # Login form
        │   ├── Signup.js    # Signup form
        │   └── Dashboard.js # After login page
        └── App.js           # Main app component
```

## API Endpoints

- `POST http://localhost:5001/api/auth/signup` - Create account
- `POST http://localhost:5001/api/auth/login` - Login
- `GET http://localhost:5001/api/health` - Check if server is running

## What's Next?

After you get login/signup working:
1. Add stock portfolio features
2. Integrate stock price API
3. Build analysis tools
4. Deploy to production

## Need Help?

Check these files for details:
- `README.md` - Full project documentation
- `MONGODB_SETUP.md` - Database setup help
- Backend logs - Check terminal running backend
- Frontend console - Press F12 in browser

---

**Deadline**: November 5th, 2025
**Current Progress**: 60% (Auth system complete, need to connect database and deploy)
