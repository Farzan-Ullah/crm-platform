import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
        await apiClient.post('/auth/refresh');
        processQueue(null);
        return apiClient(originalRequest);
      } catch (refreshErr) {
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
