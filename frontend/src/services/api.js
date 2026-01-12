import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const documentsAPI = {
  upload: (formData) => api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
  bulkDelete: (ids) => api.post('/documents/bulk-delete', { ids }),
  stream: (id) => api.get(`/documents/${id}/stream`, { responseType: 'blob' }),
  getAnalytics: (id) => api.get(`/documents/${id}/analytics`)
};

export const publicAPI = {
  getDocument: async (slug) => {
    try {
      const response = await api.get(`/public/document/${slug}`);
      return response.data;
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to fetch document' };
    }
  },
  trackView: async (slug, data = {}) => {
    try {
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });
          
          data.location = {
            coordinates: {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            }
          };
        } catch (error) {
          console.log('Location permission denied or error:', error);
        }
      }

      const response = await api.post(`/public/document/${slug}/view`, data);
      return response.data;
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to track view' };
    }
  },
  submitContact: async (slug, data) => {
    try {
      const response = await api.post(`/public/document/${slug}/contact`, data);
      return response.data;
    } catch (error) {
      return { error: error.response?.data?.error || 'Failed to submit contact info' };
    }
  },
  downloadDocument: async (slug) => {
    try {
      const response = await api.get(`/public/document/${slug}/download`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to download document');
    }
  },
  unlockVideo: async (flipbookId, mobile, sessionId) => {
    try {
      const response = await api.post('/public/unlock-video', {
        flipbookId,
        mobile,
        sessionId
      });
      return response.data;
    } catch (error) {
      return { error: error.response?.data?.message || 'Failed to unlock video' };
    }
  }
};

export const analyticsAPI = {
  getDocumentStats: (id) => api.get(`/analytics/documents/${id}`),
  getDashboardStats: () => api.get('/analytics/dashboard'),
  exportAnalytics: (id) => api.get(`/analytics/documents/${id}/export`, { responseType: 'blob' })
};