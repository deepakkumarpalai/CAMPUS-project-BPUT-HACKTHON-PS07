import api, { setAuthToken } from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
  logout: () => {
    setAuthToken(null);
    localStorage.removeItem('campus_user');
  }
};
