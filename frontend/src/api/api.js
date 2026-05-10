import axios from 'axios';

<<<<<<< HEAD
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
=======
const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
>>>>>>> ebfa0412648e52de42ee6f8ee11a6a47c077645c

const api = axios.create({ baseURL: API });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
export { API };
