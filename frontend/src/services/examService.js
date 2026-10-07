import api from './api';

export const examService = {
  list: () => api.get('/exams'),
  create: (payload) => api.post('/exams', payload),
  update: (id, payload) => api.put(`/exams/${id}`, payload),
  setResult: (id, payload) => api.put(`/exams/${id}/results`, payload),
  remove: (id) => api.delete(`/exams/${id}`)
};
