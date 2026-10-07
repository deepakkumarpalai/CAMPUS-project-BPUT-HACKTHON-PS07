import api from './api';

export const facultyAssignmentService = {
  list: () => api.get('/faculty-assignments')
};
