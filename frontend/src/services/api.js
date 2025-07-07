// frontend/src/services/api.js
// Enterprise POS System - Frontend API Client
// Handles all HTTP requests to backend with authentication, caching, and error handling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://enterprise-pos-backend.your-subdomain.workers.dev';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  // Set authentication token
  setAuthToken(token, refreshToken = null) {
    this.token = token;
    this.refreshToken = refreshToken;
    localStorage.setItem('auth_token', token);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  // Clear authentication
  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  // Build request headers
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Handle API response
  async handleResponse(response) {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshAuthToken();
        if (!refreshed) {
          this.clearAuth();
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
        return null; // Retry will be handled by caller
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Refresh authentication token
  async refreshAuthToken() {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.setAuthToken(data.accessToken, data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  // Generic request method with retry logic
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.headers)
    };

    try {
      let response = await fetch(url, config);
      let result = await this.handleResponse(response);

      // If token was refreshed, retry the request
      if (result === null && response.status === 401) {
        config.headers = this.getHeaders(options.headers);
        response = await fetch(url, config);
        result = await this.handleResponse(response);
      }

      return result;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams(params);
    const url = searchParams.toString() ? `${endpoint}?${searchParams}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Upload file with progress tracking
  async uploadFile(endpoint, file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      
      xhr.open('POST', `${this.baseURL}${endpoint}`);
      if (this.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      }
      
      xhr.send(formData);
    });
  }
}

// Create singleton instance
const api = new ApiClient();

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  profile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data)
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', params),
  getById: (id) => api.get(`/products/${id}`),
  create: (product) => api.post('/products', product),
  update: (id, product) => api.put(`/products/${id}`, product),
  delete: (id) => api.delete(`/products/${id}`),
  updateStock: (id, quantity, type) => api.patch(`/products/${id}/stock`, { quantity, type }),
  bulkUpdate: (updates) => api.post('/products/bulk-update', updates),
  getCategories: () => api.get('/products/categories'),
  search: (query) => api.get('/products/search', { q: query }),
  getLowStock: () => api.get('/products/low-stock'),
  getTopSelling: (params) => api.get('/products/top-selling', params)
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', params),
  getById: (id) => api.get(`/orders/${id}`),
  create: (order) => api.post('/orders', order),
  update: (id, order) => api.put(`/orders/${id}`, order),
  cancel: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }),
  refund: (id, amount, reason) => api.post(`/orders/${id}/refund`, { amount, reason }),
  getReceipt: (id) => api.get(`/orders/${id}/receipt`),
  getDailySales: (date) => api.get('/orders/daily-sales', { date }),
  getMonthlySales: (month) => api.get('/orders/monthly-sales', { month }),
  exportOrders: (params) => api.get('/orders/export', params)
};

// Customers API
export const customersAPI = {
  getAll: (params) => api.get('/customers', params),
  getById: (id) => api.get(`/customers/${id}`),
  create: (customer) => api.post('/customers', customer),
  update: (id, customer) => api.put(`/customers/${id}`, customer),
  delete: (id) => api.delete(`/customers/${id}`),
  search: (query) => api.get('/customers/search', { q: query }),
  getOrders: (id, params) => api.get(`/customers/${id}/orders`, params),
  updateLoyaltyPoints: (id, points, reason) => api.patch(`/customers/${id}/loyalty`, { points, reason }),
  getTopCustomers: (params) => api.get('/customers/top-customers', params)
};

// Staff API
export const staffAPI = {
  getAll: (params) => api.get('/staff', params),
  getById: (id) => api.get(`/staff/${id}`),
  create: (staff) => api.post('/staff', staff),
  update: (id, staff) => api.put(`/staff/${id}`, staff),
  delete: (id) => api.delete(`/staff/${id}`),
  getStats: (id, period) => api.get(`/staff/${id}/stats`, { period }),
  getLeaderboard: (period) => api.get('/staff/leaderboard', { period }),
  getBadges: () => api.get('/staff/badges'),
  getChallenges: () => api.get('/staff/challenges'),
  updateChallenge: (id, progress) => api.patch(`/staff/challenges/${id}`, { progress }),
  getAchievements: (staffId) => api.get(`/staff/${staffId}/achievements`),
  recordSale: (staffId, saleData) => api.post(`/staff/${staffId}/sales`, saleData)
};

// Analytics API
export const analyticsAPI = {
  getDashboard: (period) => api.get('/analytics/dashboard', { period }),
  getSalesReport: (params) => api.get('/analytics/sales', params),
  getProductReport: (params) => api.get('/analytics/products', params),
  getCustomerReport: (params) => api.get('/analytics/customers', params),
  getStaffReport: (params) => api.get('/analytics/staff', params),
  getRevenueChart: (period) => api.get('/analytics/revenue-chart', { period }),
  getProductChart: (period) => api.get('/analytics/product-chart', { period }),
  getHourlyReport: (date) => api.get('/analytics/hourly', { date }),
  exportReport: (type, params) => api.get(`/analytics/export/${type}`, params),
  getRealTimeStats: () => api.get('/analytics/realtime')
};

// AI API
export const aiAPI = {
  getRecommendations: (customerId, context) => api.post('/ai/recommendations', { customerId, context }),
  getDemandForecast: (productId, period) => api.get('/ai/demand-forecast', { productId, period }),
  getSalesPredict: (period) => api.get('/ai/sales-predict', { period }),
  getPriceOptimization: (productId) => api.get('/ai/price-optimization', { productId }),
  getInventoryAlert: () => api.get('/ai/inventory-alerts'),
  getCustomerInsights: (customerId) => api.get(`/ai/customer-insights/${customerId}`),
  getChatbotResponse: (message, context) => api.post('/ai/chatbot', { message, context }),
  getStaffSuggestions: (staffId) => api.get(`/ai/staff-suggestions/${staffId}`)
};

// WebSocket API for real-time features
export const wsAPI = {
  connect: (onMessage, onError, onClose) => {
    const wsUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const ws = new WebSocket(`${wsUrl}/ws?token=${api.token}`);
    
    ws.onmessage = onMessage;
    ws.onerror = onError || (() => {});
    ws.onclose = onClose || (() => {});
    
    return ws;
  },
  
  sendMessage: (ws, type, data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
    }
  }
};

// Utility functions
export const apiUtils = {
  // Format error messages for UI display
  formatError: (error) => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return 'An unexpected error occurred';
  },

  // Retry API call with exponential backoff
  retryWithBackoff: async (apiCall, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  // Cache API responses
  cache: new Map(),
  
  getCachedOrFetch: async (key, apiCall, ttl = 300000) => { // 5 minutes default TTL
    const cached = apiUtils.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await apiCall();
    apiUtils.cache.set(key, { data, timestamp: Date.now() });
    return data;
  },

  clearCache: (key) => {
    if (key) {
      apiUtils.cache.delete(key);
    } else {
      apiUtils.cache.clear();
    }
  }
};

// Export the main API instance and all sub-APIs
export default api;
export { 
  api, 
  authAPI, 
  productsAPI, 
  ordersAPI, 
  customersAPI, 
  staffAPI, 
  analyticsAPI, 
  aiAPI, 
  wsAPI,
  apiUtils 
};