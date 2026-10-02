import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const baseURL = rawApiUrl
  ? (rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`)
  : '/api/v1';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Authorization Bearer token if stored locally
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('crm_access_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Seamless Refresh Token Rotation
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Do not retry login, refresh, or logout itself to prevent loops
    if (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/refresh') ||
      originalRequest.url.includes('/auth/logout')
    ) {
      const formattedError = error.response?.data || {
        message: error.message || 'Network error occurred',
      };
      return Promise.reject(formattedError);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await apiClient.post('/auth/refresh');
        if (refreshResponse?.data?.accessToken && typeof window !== 'undefined') {
          localStorage.setItem('crm_access_token', refreshResponse.data.accessToken);
        }
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('crm_access_token');
        }
        processQueue(refreshErr, null);
        window.dispatchEvent(new Event('auth:unauthorized'));
        return Promise.reject(error.response?.data || refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const formattedError = error.response?.data || {
      message: error.message || 'An unexpected error occurred',
      errorCode: 'INTERNAL_ERROR',
    };
    return Promise.reject(formattedError);
  }
);
