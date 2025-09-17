import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and provide better error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 503) {
      // Service unavailable - likely database connection issue
      const errorMessage = error.response?.data?.message || 'Service temporarily unavailable';
      console.warn('Service unavailable:', errorMessage);
      
      // Don't redirect for 503 errors, let the component handle it
      return Promise.reject({
        ...error,
        message: errorMessage,
        isServiceUnavailable: true
      });
    }
    
    if (error.response?.status === 401) {
      Cookies.remove('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  getCurrentUser: (token: string) =>
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
  logout: () => api.post('/auth/logout'),
};

export const jobsAPI = {
  getJobs: (params?: any) => api.get('/jobs', { params }),
  getJob: (id: string) => api.get(`/jobs/${id}`),
  createJob: (jobData: any) => api.post('/jobs', jobData),
  updateJob: (id: string, jobData: any) => api.put(`/jobs/${id}`, jobData),
  deleteJob: (id: string) => api.delete(`/jobs/${id}`),
  getCategoriesStats: () => api.get('/jobs/categories/stats'),
};

export const applicationsAPI = {
  apply: (applicationData: any) => api.post('/applications', applicationData),
  getMyApplications: () => api.get('/applications/my-applications'),
  getJobApplications: (jobId: string) => api.get(`/applications/job/${jobId}`),
  updateStatus: (id: string, data: any) => api.patch(`/applications/${id}/status`, data),
  getApplication: (id: string) => api.get(`/applications/${id}`),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData: any) => api.put('/users/profile', profileData),
  changePassword: (passwordData: any) => api.put('/users/change-password', passwordData),
  getEmployerStats: () => api.get('/users/employer/stats'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  toggleUserStatus: (userId: string) => api.patch(`/admin/users/${userId}/toggle-status`),
};

export default api;