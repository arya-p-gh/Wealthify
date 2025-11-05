# MongoDB Atlas Setup Guide

Since MongoDB is not installed locally, we'll use MongoDB Atlas (free cloud database).

## Quick Setup Steps:

### Option 1: Use MongoDB Atlas (Recommended for Deployment)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (free tier)
4. Click "Connect" on your cluster
5. Choose "Connect your application"
6. Copy the connection string
7. Replace the MONGODB_URI in `.env` file

Your connection string should look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/wealthify?retryWrites=true&w=majority
```

### Option 2: Install MongoDB Locally

For macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

Then update .env to:
```
MONGODB_URI=mongodb://localhost:27017/wealthify
```

### Option 3: Use Docker

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## For Now - Testing Without Database

I've set up a temporary test MongoDB URI. To properly set this up:

1. Create your MongoDB Atlas account (takes 5 minutes)
2. Update the .env file with your connection string
3. Or install MongoDB locally using Option 2 above
