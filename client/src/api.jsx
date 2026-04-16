// src/api.js
import axios from 'axios';

// 1. Point our messenger to the Node.js backend
const API = axios.create({
    // baseURL: 'http://localhost:3000/api',
    baseURL: "https://bharatautomobiles.onrender.com/api",
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

export default API;