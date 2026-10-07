import api from './api';

export const certificateService = {
  list: (params) => api.get('/certificates', { params }),
  get: (id) => api.get(`/certificates/${id}`),
  create: (payload) => api.post('/certificates', payload),
  update: (id, payload) => api.put(`/certificates/${id}`, payload)
};
