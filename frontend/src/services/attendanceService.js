import api from './api';

export const attendanceService = {
  list: (params) => api.get('/attendance', { params }),
  summary: (params) => api.get('/attendance/summary', { params }),
  students: (params) => api.get('/attendance/students', { params }),
  create: (payload) => api.post('/attendance', payload),
  update: (id, payload) => api.put(`/attendance/${id}`, payload),
  remove: (id) => api.delete(`/attendance/${id}`)
};
