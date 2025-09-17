# MongoDB Setup Guide for Hostel Management System

## Prerequisites
1. Install MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Or use MongoDB Atlas (cloud) for easier setup

## Local MongoDB Setup

### Option 1: Using MongoDB Community Server
1. Download and install MongoDB Community Server
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

### Option 2: Using MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update the MONGODB_URI in app.js or set environment variable:
   ```bash
   export MONGODB_URI="your-atlas-connection-string"
   ```

## Running the Application

1. Make sure MongoDB is running
2. Start the application:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

3. Open http://localhost:4000 in your browser

## API Endpoints

- `GET /api/complaints` - Get all complaints
- `GET /api/complaints?status=pending&category=electrical` - Get filtered complaints
- `POST /api/complaints` - Create new complaint
- `PATCH /api/complaints/:id/status` - Update complaint status
- `PATCH /api/complaints/:id/resolve` - Resolve complaint
- `DELETE /api/complaints/:id` - Delete complaint
- `GET /api/dashboard/stats` - Get dashboard statistics

## Testing the Integration

1. Submit a new complaint through the web interface
2. Check MongoDB to see if the complaint was saved
3. Try updating complaint status
4. Test filtering functionality
5. Verify dashboard statistics update correctly

## Troubleshooting

- If MongoDB connection fails, check if MongoDB is running
- For Atlas, ensure your IP is whitelisted
- Check console logs for any error messages
- Verify the MONGODB_URI is correct
