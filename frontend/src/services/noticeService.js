import api from './api';

export const noticeService = {
  list: () => api.get('/notices'),
  get: (id) => api.get(`/notices/${id}`),
  create: (payload) => api.post('/notices', payload),
  update: (id, payload) => api.put(`/notices/${id}`, payload),
  remove: (id) => api.delete(`/notices/${id}`)
};
