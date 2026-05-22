import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { API_BASE_URL } from './config'

// Automatically rewrite any local backend URLs to the deployed URL
axios.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith('http://localhost:8080')) {
      config.url = config.url.replace('http://localhost:8080', API_BASE_URL);
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
