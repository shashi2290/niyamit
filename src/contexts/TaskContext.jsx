import { createContext, useContext, useState, useEffect } from 'react';
import { taskAPI, tagAPI } from '../services/api';
import { CATEGORIES } from '../data/mockData';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load initial data from MongoDB
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Fetch tags
                const fetchedTags = await tagAPI.getAll();

                // If no tags exist, initialize with default categories
                if (fetchedTags.length === 0) {
                    const defaultTags = Object.values(CATEGORIES);
                    const createdTags = await Promise.all(
                        defaultTags.map(tag => tagAPI.create(tag))
                    );
                    setTags(createdTags);
                } else {
                    setTags(fetchedTags);
                }

                // Fetch tasks
                const fetchedTasks = await taskAPI.getAll();
                setTasks(fetchedTasks);

                setError(null);
            } catch (err) {
                console.error('Error loading data:', err);
                setError(err.message);
                // Fallback to empty arrays if server is not available
                setTags(Object.values(CATEGORIES));
                setTasks([]);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const toggleTask = async (taskId) => {
        try {
            const updatedTask = await taskAPI.toggle(taskId);
            setTasks(prev => prev.map(t =>
                (t._id || t.id) === taskId ? updatedTask : t
            ));
        } catch (err) {
            console.error('Error toggling task:', err);
            setError(err.message);
        }
    };

    const addTask = async (task) => {
        try {
            const newTask = await taskAPI.create(task);
            setTasks(prev => [...prev, newTask]);
        } catch (err) {
            console.error('Error adding task:', err);
            setError(err.message);
        }
    };

    const updateTask = async (updatedTask) => {
        try {
            const taskId = updatedTask._id || updatedTask.id;
            const task = await taskAPI.update(taskId, updatedTask);
            setTasks(prev => prev.map(t => ((t._id || t.id) === taskId ? task : t)));
        } catch (err) {
            console.error('Error updating task:', err);
            setError(err.message);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await taskAPI.delete(taskId);
            setTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));
        } catch (err) {
            console.error('Error deleting task:', err);
            setError(err.message);
        }
    };

    const addTag = async (tag) => {
        try {
            const newTag = await tagAPI.create(tag);
            setTags(prev => [...prev, newTag]);
        } catch (err) {
            console.error('Error adding tag:', err);
            setError(err.message);
        }
    };

    const deleteTag = async (tagId) => {
        try {
            await tagAPI.delete(tagId);
            setTags(prev => prev.filter(t => t.id !== tagId));
        } catch (err) {
            console.error('Error deleting tag:', err);
            setError(err.message);
        }
    };

    const getTasksByDate = (dateStr) => {
        return tasks.filter(t => t.date === dateStr);
    };

    const getStats = () => {
        return tasks;
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: 'var(--text-primary)'
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <TaskContext.Provider value={{
            tasks,
            tags,
            loading,
            error,
            toggleTask,
            addTask,
            updateTask,
            deleteTask,
            addTag,
            deleteTag,
            getTasksByDate,
            getStats
        }}>
            {children}
        </TaskContext.Provider>
    );
};
