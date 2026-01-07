import axios from 'axios';
import { API_URL } from '../utils/constants';
import { getToken } from './storage';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Interceptor token error:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Add auth token to requests
// api.interceptors.request.use(async (config) => {
//   const token = await getToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default api;