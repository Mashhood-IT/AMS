import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const api = {
  // Auth endpoints
  login: async (credentials) => {
    try {
      const response = await apiInstance.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  // Future endpoints can be added here
  signup: async (userData) => {
    try {
      const response = await apiInstance.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getMe: async () => {
    try {
      const response = await apiInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await apiInstance.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await apiInstance.post('/auth/reset-password', { token, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  markAttendance: async (data) => {
    try {
      const response = await apiInstance.post('/attendance', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  bulkMarkAttendance: async (data) => {
    try {
      const response = await apiInstance.post('/attendance/bulk', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAttendance: async (params = {}) => {
    try {
      const response = await apiInstance.get('/attendance', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAttendanceByCourse: async (courseId, params = {}) => {
    try {
      const response = await apiInstance.get(`/attendance/course/${courseId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAttendanceByStudent: async (studentId, params = {}) => {
    try {
      const response = await apiInstance.get(`/attendance/student/${studentId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getAttendanceSummary: async (params = {}) => {
    try {
      const response = await apiInstance.get('/attendance/summary', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  updateAttendance: async (id, data) => {
    try {
      const response = await apiInstance.put(`/attendance/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  deleteAttendance: async (id) => {
    try {
      const response = await apiInstance.delete(`/attendance/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getCourses: async (params = {}) => {
    try {
      const response = await apiInstance.get('/courses', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getInstituteById: async (id) => {
    try {
      const response = await apiInstance.get(`/institutes/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getUsers: async (params = {}) => {
    try {
      const response = await apiInstance.get('/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getQRToken: async (courseId) => {
    try {
      const response = await apiInstance.get(`/attendance/qr-token/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  markAttendanceQR: async (data) => {
    try {
      const response = await apiInstance.post('/attendance/mark-qr', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },
};

export default api;
