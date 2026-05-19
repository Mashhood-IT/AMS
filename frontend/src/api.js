import axios from 'axios';

let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Dynamically resolve backend IP to allow mobile devices to connect when running locally
if (typeof window !== 'undefined') {
  const currentHostname = window.location.hostname;
  const isLocal = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
  const devIP = import.meta.env.VITE_DEV_IP;

  try {
    const url = new URL(BASE_URL);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      if (!isLocal) {
        url.hostname = currentHostname;
      } else if (devIP && devIP !== 'localhost') {
        url.hostname = devIP;
      }
      BASE_URL = url.toString();
    }
  } catch (e) {
    console.error('Failed to parse BASE_URL', e);
  }
}

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

  sendLowAttendanceAlerts: async (data) => {
    try {
      const response = await apiInstance.post('/attendance/send-low-alerts', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getStudentAttendanceSummary: async (studentId) => {
    try {
      const response = await apiInstance.get(`/attendance/student-summary/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  sendManualAttendanceAlert: async (data) => {
    try {
      const response = await apiInstance.post('/attendance/send-manual-alert', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  getLmsConfig: async () => {
    try {
      const response = await apiInstance.get('/lms/config');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  updateLmsConfig: async (data) => {
    try {
      const response = await apiInstance.post('/lms/config', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },

  verifyLmsEmbed: async (params) => {
    try {
      const response = await apiInstance.get('/lms/verify-embed', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error or server unavailable' };
    }
  },
};

export default api;

