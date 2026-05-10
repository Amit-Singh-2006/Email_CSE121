import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: (email: string, password: string) =>
    client.post('/api/auth/login', { email, password }),

  // Students
  getStudents: (params?: any) =>
    client.get('/api/students', { params }),
  getStudent: (id: string) =>
    client.get(`/api/students/${id}`),
  sendReport: (id: string) =>
    client.post(`/api/students/${id}/send-report`),
  sendWhatsApp: (id: string) =>
    client.post(`/api/students/${id}/send-whatsapp`),

  // Analytics
  getAnalytics: () =>
    client.get('/api/alerts/analytics'),

  // Upload
  uploadStudents: (formData: FormData) =>
    client.post('/api/upload/students', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // AI
  generateMessage: (id: string, tone: string) =>
    client.post(`/api/ai/generate-message/${id}`, { tone }),
};