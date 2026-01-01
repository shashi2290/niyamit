import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { taskAPI, tagAPI } from '../services/api';

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
    const { getToken, isLoaded, isSignedIn } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load initial data from MongoDB
    useEffect(() => {
        const loadData = async () => {
            if (!isLoaded || !isSignedIn) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const token = await getToken();

                // Fetch tasks (triggers seeding for new users if needed)
                const fetchedTasks = await taskAPI.getAll(token);
                setTasks(fetchedTasks);

                // Fetch tags
                const fetchedTags = await tagAPI.getAll(token);
                setTags(fetchedTags);

                setError(null);
            } catch (err) {
                console.error('Error loading data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isLoaded, isSignedIn, getToken]);

    const toggleTask = async (taskId) => {
        try {
            const token = await getToken();
            const updatedTask = await taskAPI.toggle(token, taskId);
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
            const token = await getToken();
            const newTask = await taskAPI.create(token, task);
            setTasks(prev => [...prev, newTask]);
        } catch (err) {
            console.error('Error adding task:', err);
            setError(err.message);
        }
    };

    const updateTask = async (updatedTask) => {
        try {
            const token = await getToken();
            const taskId = updatedTask._id || updatedTask.id;
            const task = await taskAPI.update(token, taskId, updatedTask);
            setTasks(prev => prev.map(t => ((t._id || t.id) === taskId ? task : t)));
        } catch (err) {
            console.error('Error updating task:', err);
            setError(err.message);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            const token = await getToken();
            await taskAPI.delete(token, taskId);
            setTasks(prev => prev.filter(t => (t._id || t.id) !== taskId));
        } catch (err) {
            console.error('Error deleting task:', err);
            setError(err.message);
        }
    };

    const addTag = async (tag) => {
        try {
            const token = await getToken();
            const newTag = await tagAPI.create(token, tag);
            setTags(prev => [...prev, newTag]);
        } catch (err) {
            console.error('Error adding tag:', err);
            setError(err.message);
        }
    };

    const updateTag = async (updatedTag) => {
        try {
            const token = await getToken();
            const tag = await tagAPI.update(token, updatedTag.id, updatedTag);
            setTags(prev => prev.map(t => (t.id === updatedTag.id ? tag : t)));
        } catch (err) {
            console.error('Error updating tag:', err);
            setError(err.message);
        }
    };

    const deleteTag = async (tagId) => {
        try {
            const token = await getToken();
            await tagAPI.delete(token, tagId);
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

    if (!isLoaded) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                color: 'var(--text-primary)'
            }}>
                <div>Loading authentication...</div>
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
            updateTag,
            deleteTag,
            getTasksByDate,
            getStats
        }}>
            {children}
        </TaskContext.Provider>
    );
};