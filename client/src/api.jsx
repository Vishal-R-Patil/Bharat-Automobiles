// src/api.js
import axios from 'axios';

// 1. Point our messenger to the Node.js backend
const API = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3000/api", // Fallback to localhost if env variable is missing
    // baseURL: "http://localhost:3000/api",
    // baseURL: "https://bharatautomobiles.onrender.com/api",
});

// 2. The Auto-Bouncer: Before any request leaves the frontend, attach the token!
API.interceptors.request.use((req) => {
    // Check if the browser wallet (localStorage) has a token
    const token = localStorage.getItem('token');
    
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

//3. auto logout 
// 3. Handle expired sessions globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Remove expired token
      localStorage.removeItem('token');

      // Optional: show message
      alert('Session expired. Please login again.');

      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;