import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import API_BASE_URL from './config';
import App from './App.jsx';
import './index.css';

// Set global axios base URL
axios.defaults.baseURL = API_BASE_URL;

// Optional: Interceptor to ensure we never have double slashes if a relative URL starts with /
axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('/') && API_BASE_URL.endsWith('/')) {
    config.url = config.url.substring(1);
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 
