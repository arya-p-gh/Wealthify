# 💰 Wealthify - Stock Management & Analysis Platform

## Project Overview
Wealthify is a stock management and analysis website built as part of the AP Capstone Project.

**Deadline for Milestone 1**: November 5th, 2025
**Status**: Login/Signup functionality with JWT authentication ✅

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React.js
- CSS3
- LocalStorage for token management

## Project Structure
```
wealthify/
├── backend/
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   └── auth.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Login.js
    │   │   ├── Signup.js
    │   │   └── Dashboard.js
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies (already done):
```bash
npm install
```

3. Make sure MongoDB is running locally, or update `.env` with your MongoDB Atlas connection string

4. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Dependencies are already installed via create-react-app

3. Start the React development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## Features Implemented ✅

### Authentication
- ✅ User Signup with validation
- ✅ User Login with JWT tokens
- ✅ Password hashing with bcryptjs
- ✅ Token storage in localStorage
- ✅ Protected dashboard route
- ✅ Logout functionality

### API Endpoints
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/health` - Health check endpoint

## Testing the Application

### Manual Testing Steps

1. **Start MongoDB**: Make sure MongoDB is running
   ```bash
   # For macOS with homebrew
   brew services start mongodb-community
   ```

2. **Start Backend**: In one terminal
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend**: In another terminal
   ```bash
   cd frontend
   npm start
   ```

4. **Test Signup**:
   - Go to `http://localhost:3000`
   - Click "Sign up here"
   - Fill in the form with your details
   - Submit and verify you're redirected to dashboard

5. **Test Login**:
   - Logout from dashboard
   - Login with the credentials you just created
   - Verify successful login and dashboard display

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wealthify
JWT_SECRET=wealthify_secret_key_2025
```

## Next Steps (Future Milestones)

- [ ] Stock portfolio management
- [ ] Real-time stock price integration
- [ ] Stock analysis tools
- [ ] Watchlist functionality
- [ ] Deployment to production

## Deployment Plan

### Frontend
- Deploy to **Vercel** or **Netlify**

### Backend
- Deploy to **Render**, **Railway**, or **Heroku**

### Database
- Use **MongoDB Atlas** for cloud database

## Author
Arya Pandey - AP Capstone Project

## License
ISC
