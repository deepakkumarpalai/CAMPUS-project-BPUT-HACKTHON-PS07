import api from './api';

export const academicService = {
  list: () => api.get('/academics'),
  importWorkbook: (workbook) => {
    const body = new FormData();
    body.append('workbook', workbook);
    return api.post('/academics/import', body);
  }
};
