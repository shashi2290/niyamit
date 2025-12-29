# Niyamit Backend Server

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally on port 27017)

## Setup Instructions

### 1. Install MongoDB (if not already installed)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
```

### 2. Start MongoDB

**macOS:**
```bash
brew services start mongodb-community
```

Or run it manually:
```bash
mongod --config /opt/homebrew/etc/mongod.conf
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Seed the Database (Optional - for initial data)

```bash
npm run seed
```

This will populate the database with sample tasks and tags for the last 30 days and next 7 days.

### 5. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/date/:date` - Get tasks by date (YYYY-MM-DD)
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion
- `DELETE /api/tasks/:id` - Delete a task

### Tags
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create a new tag
- `DELETE /api/tags/:id` - Delete a tag

### Health Check
- `GET /api/health` - Server health check

## Environment Variables

Create a `.env` file in the server directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/niyamit
```

## Troubleshooting

### MongoDB Connection Issues

1. Check if MongoDB is running:
```bash
brew services list | grep mongodb
```

2. Check MongoDB logs:
```bash
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

3. Test MongoDB connection:
```bash
mongosh
```

### Port Already in Use

If port 5000 is already in use, change the PORT in `.env` file.
