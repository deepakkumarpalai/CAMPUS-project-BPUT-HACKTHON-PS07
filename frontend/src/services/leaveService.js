import api from './api';

export const leaveService = {
  list: (params) => api.get('/leave', { params }),
  get: (id) => api.get(`/leave/${id}`),
  create: (payload) => api.post('/leave', payload),
  update: (id, payload) => api.put(`/leave/${id}`, payload)
};
