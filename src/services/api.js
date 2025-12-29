const API_BASE_URL = 'http://localhost:5000/api';

// ============ TASK API ============

export const taskAPI = {
    // Get all tasks
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    // Get tasks by date
    getByDate: async (date) => {
        const response = await fetch(`${API_BASE_URL}/tasks/date/${date}`);
        if (!response.ok) throw new Error('Failed to fetch tasks by date');
        return response.json();
    },

    // Create a new task
    create: async (task) => {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!response.ok) throw new Error('Failed to create task');
        return response.json();
    },

    // Update a task
    update: async (id, task) => {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        if (!response.ok) throw new Error('Failed to update task');
        return response.json();
    },

    // Toggle task completion
    toggle: async (id) => {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}/toggle`, {
            method: 'PATCH'
        });
        if (!response.ok) throw new Error('Failed to toggle task');
        return response.json();
    },

    // Delete a task
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete task');
        return response.json();
    }
};

// ============ TAG API ============

export const tagAPI = {
    // Get all tags
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/tags`);
        if (!response.ok) throw new Error('Failed to fetch tags');
        return response.json();
    },

    // Create a new tag
    create: async (tag) => {
        const response = await fetch(`${API_BASE_URL}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tag)
        });
        if (!response.ok) throw new Error('Failed to create tag');
        return response.json();
    },

    // Delete a tag
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete tag');
        return response.json();
    }
};
