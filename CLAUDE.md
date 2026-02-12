# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Niyamit** is a personal life organizer/habit tracker with a React frontend and Express/MongoDB backend. It features a premium dark theme with glassmorphism, GitHub-style activity heatmaps, and analytics dashboards.

## Development Commands

### Frontend (Root Directory)

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend (Server Directory)

```bash
cd server
npm install          # Install dependencies
npm run dev          # Start with auto-reload (port 5000)
npm start            # Production mode
npm run seed         # Seed database with sample data
```

### Full Stack Development

Run both frontend and backend simultaneously:

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:5000` (configured in `vite.config.js`).

## Architecture

### Frontend Architecture

**Tech Stack:**
- React 19 with hooks (no class components)
- React Router v7 for routing
- Clerk for authentication (`@clerk/clerk-react`)
- Recharts for data visualization
- date-fns for date manipulation
- Sonner for toast notifications
- Vanilla CSS with CSS variables for theming

**Key Directories:**
- `src/components/` - React components (Layout, Dashboard, CalendarView, Settings)
- `src/contexts/` - React context providers (TaskContext for state management)
- `src/services/` - API service layer (`api.js` - all backend communication)
- `src/data/` - Mock data utilities

**State Management:**
- `TaskContext` is the single source of truth for tasks and tags
- Uses optimistic updates for toggling tasks (reverts on error)
- Authentication state from Clerk's `useAuth()` hook
- All API calls require a JWT token from `getToken()`

**Styling Approach:**
- CSS variables defined in `src/index.css` for theming
- Glassmorphism effect via `--glass-bg` and `--glass-border` variables
- Dark theme with purple (`--primary: #8b5cf6`) as accent color
- Components use utility classes like `.glass-panel`, `.btn-icon`, `.text-muted`
- Responsive design with mobile bottom nav and collapsible sidebar

### Backend Architecture

**Tech Stack:**
- Express.js with ES modules (`"type": "module"`)
- MongoDB with Mongoose ODM
- Clerk SDK for authentication middleware
- CORS enabled for development

**Key Files:**
- `server/server.js` - Main Express app with route definitions
- `server/models/Task.js` - Mongoose schema for tasks
- `server/models/Tag.js` - Mongoose schema for tags
- `server/seed.js` - Database seeding script

**Authentication:**
- All API routes (except `/api/health`) use `ClerkExpressRequireAuth()` middleware
- User ID from `req.auth.userId` is used to scope all database queries
- New users are auto-seeded with default tasks and tags on first fetch

**API Structure:**
- `/api/tasks` - CRUD operations for tasks
- `/api/tasks/date/:date` - Get tasks by specific date (YYYY-MM-DD)
- `/api/tasks/:id/toggle` - Toggle completion status
- `/api/tags` - CRUD operations for tags
- `/api/health` - Health check endpoint

**Data Model:**
- Tasks have: title, date (string YYYY-MM-DD), startTime/endTime, category (embedded object), completed boolean, userId
- Tags have: id, label, color, userId (unique index on id+userId)
- All queries filter by `userId` for multi-tenancy

### Data Flow

1. User authenticates via Clerk (SignIn/SignUp components in App.jsx)
2. `TaskContext` loads initial data via `taskAPI.getAll()` and `tagAPI.getAll()`
3. Frontend components consume state from `useTasks()` hook
4. Mutations go through context methods which call `api.js` service functions
5. API service adds `Authorization: Bearer <token>` header to all requests
6. Backend verifies JWT with Clerk middleware
7. MongoDB queries scoped to `userId` from `req.auth`

### PWA Configuration

The app is configured as a PWA via `vite-plugin-pwa`:
- Service worker with auto-update
- Manifest in `vite.config.js` with theme colors
- Icons in `public/vite.png`
- Dev options enabled for PWA testing in development

## Environment Variables

### Frontend (.env)
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key for authentication

### Backend (server/.env)
- `PORT` - Server port (default 5000)
- `MONGODB_URI` - MongoDB connection string
- `CLERK_SECRET_KEY` - Clerk secret key for verifying JWTs

## Common Patterns

### Adding a New API Endpoint

1. Add route handler in `server/server.js`
2. Add corresponding service function in `src/services/api.js`
3. Add context method in `src/contexts/TaskContext.jsx` if it affects global state
4. Use `requireAuth` middleware to ensure authentication

### Working with Dates

- Store dates as strings in `YYYY-MM-DD` format in MongoDB
- Use `date-fns` for all date manipulation in frontend
- Use `parse(dateStr, 'yyyy-MM-dd', new Date())` to convert strings to Date objects

### Task ID Handling

Tasks may have either `_id` (MongoDB ObjectId) or `id` (legacy). Use helper:
```javascript
const getTaskId = (task) => task._id || task.id;
```

### Mobile Responsiveness

The app uses:
- Sidebar on desktop (collapsible)
- Bottom nav on mobile (hidden on md screens)
- `isMobile` state checked via `window.innerWidth < 768`
- Horizontal scroll containers for task lists on mobile

## Linting

ESLint config in `eslint.config.js`:
- Uses flat config format
- React Hooks and React Refresh plugins enabled
- Allows unused variables matching `^[A-Z_]` (for component names)
- Ignores `dist/` directory
