import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('job_board_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('job_board_token');
      localStorage.removeItem('job_board_user');
    }
    return Promise.reject(error);
  },
);

export default api;
