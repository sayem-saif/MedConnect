import axios from 'axios';

const getDefaultBackendUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:8000';
  }

  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';

  // Use local backend during local development, and same-origin in production by default.
  return isLocalHost ? 'http://127.0.0.1:8000' : window.location.origin;
};

const rawBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || getDefaultBackendUrl();

// App code calls endpoints with a leading /api path.
// Normalize env values so both http://host:port and http://host:port/api work.
const API_URL = rawBackendUrl.replace(/\/+$/, '').replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
