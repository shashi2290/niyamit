// const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = "/api";

const getHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ============ TASK API ============

export const taskAPI = {
  // Get all tasks
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return response.json();
  },

  // Get tasks by date
  getByDate: async (token, date) => {
    const response = await fetch(`${API_BASE_URL}/tasks/date/${date}`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch tasks by date");
    return response.json();
  },

  // Create a new task
  create: async (token, task) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error("Failed to create task");
    return response.json();
  },

  // Update a task
  update: async (token, id, task) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error("Failed to update task");
    return response.json();
  },

  // Toggle task completion
  toggle: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/toggle`, {
      method: "PATCH",
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to toggle task");
    return response.json();
  },

  // Delete a task
  delete: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to delete task");
    return response.json();
  },
};

// ============ TAG API ============

export const tagAPI = {
  // Get all tags
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to fetch tags");
    return response.json();
  },

  // Create a new tag
  create: async (token, tag) => {
    const response = await fetch(`${API_BASE_URL}/tags`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(tag),
    });
    if (!response.ok) throw new Error("Failed to create tag");
    return response.json();
  },

  // Update a tag
  update: async (token, id, tag) => {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: "PUT",
      headers: getHeaders(token),
      body: JSON.stringify(tag),
    });
    if (!response.ok) throw new Error("Failed to update tag");
    return response.json();
  },

  // Delete a tag
  delete: async (token, id) => {
    const response = await fetch(`${API_BASE_URL}/tags/${id}`, {
      method: "DELETE",
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error("Failed to delete tag");
    return response.json();
  },
};
