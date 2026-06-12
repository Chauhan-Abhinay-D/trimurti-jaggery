import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { API_URL } from './config'

// Set default base URL for all Axios requests
axios.defaults.baseURL = API_URL;

// Automatically rewrite any local backend URLs to the deployed URL
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.url && config.url.startsWith('http://localhost:8080')) {
      config.url = config.url.replace('http://localhost:8080', API_URL);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
