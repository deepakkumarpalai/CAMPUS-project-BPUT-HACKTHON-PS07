import api from './api';

export const campusRequestService = {
  list: (params) => api.get('/campus-requests', { params }),
  get: (id) => api.get(`/campus-requests/${id}`),
  create: (payload) => api.post('/campus-requests', payload),
  update: (id, payload) => api.put(`/campus-requests/${id}`, payload)
};
