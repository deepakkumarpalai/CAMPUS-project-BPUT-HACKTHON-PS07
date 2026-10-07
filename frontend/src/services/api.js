import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('campus_token', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('campus_token');
  }
};

const existing = localStorage.getItem('campus_token');
if (existing) setAuthToken(existing);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (!error.response) {
      error.userMessage = 'Network error. Check your internet connection and that the backend is running.';
    } else if (status === 401) {
      error.userMessage = error.response.data?.message || 'Session expired. Please log in again.';
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('campus_token');
        localStorage.removeItem('campus_user');
      }
    } else if (status === 403) {
      error.userMessage = error.response.data?.message || 'You do not have permission for this action.';
    } else if (status === 404) {
      error.userMessage = error.response.data?.message || 'The requested resource was not found.';
    } else if (status >= 500) {
      error.userMessage = 'Server error. Please try again.';
    } else {
      error.userMessage = error.response.data?.message || 'Request failed.';
    }
    return Promise.reject(error);
  }
);

export default api;
