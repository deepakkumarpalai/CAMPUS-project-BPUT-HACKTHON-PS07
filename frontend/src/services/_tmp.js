import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { setAuthToken } from './api';

export const getToken = () => localStorage.getItem('campus_token');

const api = {
  get: async (url) => {
    const { default: axios } = await import('axios');
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      headers: { Authorization: `Bearer ${getToken()}` }
    }).get(url);
  }
};

export { api };
