import api from './api';

export const gatePassService = {
  list: (params) => api.get('/gate-pass', { params }),
  get: (id) => api.get(`/gate-pass/${id}`),
  create: (payload) => api.post('/gate-pass', payload),
  update: (id, payload) => api.put(`/gate-pass/${id}`, payload)
};
