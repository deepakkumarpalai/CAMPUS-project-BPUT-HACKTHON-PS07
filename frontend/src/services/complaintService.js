import api from './api';

export const complaintService = {
  list: (params) => api.get('/complaints', { params }),
  get: (id) => api.get(`/complaints/${id}`),
  create: (payload) => api.post('/complaints', payload),
  update: (id, payload) => api.put(`/complaints/${id}`, payload),
  remove: (id) => api.delete(`/complaints/${id}`),
  analytics: () => api.get('/complaints/analytics/summary')
};
