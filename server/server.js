import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import Task from './models/Task.js';
import Tag from './models/Tag.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Auth Middleware
// This will attach req.auth to the request object
// req.auth.userId will be available
const requireAuth = ClerkExpressRequireAuth();

// Helper to seed new user
const seedNewUser = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Default Tags
    const defaultTags = [
        { id: `work-${userId}`, label: 'Work', color: '#3b82f6', userId },
        { id: `personal-${userId}`, label: 'Personal', color: '#10b981', userId },
        { id: `urgent-${userId}`, label: 'Urgent', color: '#ef4444', userId },
    ];

    // Default Tasks
    const defaultTasks = [
        {
            title: 'Welcome to Niyamit! 👋',
            date: today,
            startTime: '09:00',
            endTime: '09:30',
            category: defaultTags[0],
            userId,
            completed: false
        },
        {
            title: 'Create your first task',
            date: today,
            startTime: '10:00',
            endTime: '10:15',
            category: defaultTags[0],
            userId,
            completed: false
        },
        {
            title: 'Explore the calendar view',
            date: today,
            startTime: '11:00',
            endTime: '11:30',
            category: defaultTags[1],
            userId,
            completed: false
        },
        {
            title: 'Set up your tags',
            date: today,
            startTime: '14:00',
            endTime: '14:30',
            category: defaultTags[1],
            userId,
            completed: false
        },
        {
            title: 'Review your day',
            date: today,
            startTime: '17:00',
            endTime: '17:15',
            category: defaultTags[2],
            userId,
            completed: false
        }
    ];

    try {
        await Tag.insertMany(defaultTags);
        await Task.insertMany(defaultTasks);
        console.log(`✅ Seeded data for new user: ${userId}`);
        return await Task.find({ userId }).sort({ date: 1, startTime: 1 });
    } catch (error) {
        console.error('❌ Error seeding user:', error);
        return [];
    }
};

// ============ TAG ROUTES ============

// Get all tags
app.get('/api/tags', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        const tags = await Tag.find({ userId });
        res.json(tags);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new tag
app.post('/api/tags', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        const tag = new Tag({ ...req.body, userId });
        const newTag = await tag.save();
        res.status(201).json(newTag);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a tag
app.put('/api/tags/:id', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        const updatedTag = await Tag.findOneAndUpdate(
            { id: req.params.id, userId },
            req.body,
            { new: true }
        );
        if (!updatedTag) {
            return res.status(404).json({ message: 'Tag not found or unauthorized' });
        }
        res.json(updatedTag);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a tag
app.delete('/api/tags/:id', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        await Tag.findOneAndDelete({ id: req.params.id, userId });
        res.json({ message: 'Tag deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============ TASK ROUTES ============

// Get all tasks (with auto-seeding for new users)
app.get('/api/tasks', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        let tasks = await Task.find({ userId }).sort({ date: 1, startTime: 1 });
        
        // Check if user is new (has no tasks)
        // We also check tags to be safe, but tasks are the main indicator here
        if (tasks.length === 0) {
            const taskCount = await Task.countDocuments({ userId });
            if (taskCount === 0) {
                 tasks = await seedNewUser(userId);
            }
        }

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get tasks by date
app.get('/api/tasks/date/:date', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        const tasks = await Task.find({ date: req.params.date, userId }).sort({ startTime: 1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new task
app.post('/api/tasks', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        const task = new Task({ ...req.body, userId });
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a task
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        const updatedTask = await Task.findOneAndUpdate(
            { _id: req.params.id, userId },
            req.body,
            { new: true }
        );
        if (!updatedTask) {
             return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Toggle task completion
app.patch('/api/tasks/:id/toggle', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        const task = await Task.findOne({ _id: req.params.id, userId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        task.completed = !task.completed;
        const updatedTask = await task.save();
        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a task
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
    try {
        const { userId } = req.auth;
        const result = await Task.findOneAndDelete({ _id: req.params.id, userId });
        if (!result) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling for Clerk auth errors
app.use((err, req, res, next) => {
  if (err.message === 'Unauthenticated') {
      res.status(401).json({ message: 'Unauthenticated' });
  } else {
      next(err);
  }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});