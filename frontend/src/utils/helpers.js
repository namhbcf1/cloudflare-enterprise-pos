import { CURRENCY, DATE_FORMATS, ORDER_STATUS_COLORS, LOYALTY_TIERS } from './constants';
import { notification } from 'antd';

// Date and Time Utilities
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';

  switch (format) {
    case DATE_FORMATS.DISPLAY:
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    
    case DATE_FORMATS.DISPLAY_WITH_TIME:
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case DATE_FORMATS.API:
      return dateObj.toISOString().split('T')[0];
    
    case DATE_FORMATS.API_WITH_TIME:
      return dateObj.toISOString().slice(0, 19).replace('T', ' ');
    
    case DATE_FORMATS.TIME_ONLY:
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case DATE_FORMATS.RELATIVE:
      return getRelativeTime(dateObj);
    
    default:
      return dateObj.toLocaleDateString();
  }
};

export const getRelativeTime = (date) => {
  const now = new Date();
  const dateObj = new Date(date);
  const diffInMs = now - dateObj;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date, DATE_FORMATS.DISPLAY);
};

export const isToday = (date) => {
  const today = new Date();
  const dateObj = new Date(date);
  return today.toDateString() === dateObj.toDateString();
};

export const isThisWeek = (date) => {
  const today = new Date();
  const dateObj = new Date(date);
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  return dateObj >= startOfWeek && dateObj <= endOfWeek;
};

// Currency and Number Utilities
export const formatCurrency = (amount, options = {}) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${CURRENCY.SYMBOL}0${CURRENCY.DECIMAL_SEPARATOR}00`;
  }

  const {
    symbol = CURRENCY.SYMBOL,
    decimals = CURRENCY.DECIMAL_PLACES,
    thousandSeparator = CURRENCY.THOUSAND_SEPARATOR,
    decimalSeparator = CURRENCY.DECIMAL_SEPARATOR,
    showSymbol = true,
  } = options;

  const fixedAmount = parseFloat(amount).toFixed(decimals);
  const [integerPart, decimalPart] = fixedAmount.split('.');
  
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  const formattedAmount = decimalPart ? 
    `${formattedInteger}${decimalSeparator}${decimalPart}` : 
    formattedInteger;

  return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount;
};

export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  const cleanString = currencyString.toString().replace(/[^0-9.-]/g, '');
  return parseFloat(cleanString) || 0;
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) return '0';
  return parseFloat(number).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// String Utilities
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const camelToTitle = (str) => {
  if (!str) return '';
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

export const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).trim() + suffix;
};

export const generateId = (prefix = '', length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}-${result}` : result;
};

// Array and Object Utilities
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const groupKey = item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
};

export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (direction === 'desc') {
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    }
    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
  });
};

export const filterBy = (array, filters) => {
  return array.filter(item => {
    return Object.keys(filters).every(key => {
      const filterValue = filters[key];
      const itemValue = item[key];
      
      if (filterValue === null || filterValue === undefined || filterValue === '') {
        return true;
      }
      
      if (typeof filterValue === 'string') {
        return itemValue?.toString().toLowerCase().includes(filterValue.toLowerCase());
      }
      
      return itemValue === filterValue;
    });
  });
};

export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    Object.keys(obj).forEach(key => {
      clonedObj[key] = deepClone(obj[key]);
    });
    return clonedObj;
  }
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Validation Utilities
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const isValidBarcode = (barcode) => {
  if (!barcode || typeof barcode !== 'string') return false;
  return /^[0-9]{8,13}$/.test(barcode);
};

export const validateRequired = (value, fieldName = 'Field') => {
  if (isEmpty(value)) {
    return `${fieldName} is required`;
  }
  return null;
};

// Business Logic Utilities
export const calculateTax = (amount, taxRate = 0.1) => {
  return parseFloat((amount * taxRate).toFixed(2));
};

export const calculateDiscount = (amount, discountPercentage) => {
  if (!discountPercentage || discountPercentage <= 0) return 0;
  return parseFloat((amount * (discountPercentage / 100)).toFixed(2));
};

export const calculateTotal = (subtotal, tax = 0, discount = 0, shipping = 0) => {
  return parseFloat((subtotal + tax + shipping - discount).toFixed(2));
};

export const calculateOrderTotal = (items, taxRate = 0.1, discountPercentage = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = calculateDiscount(subtotal, discountPercentage);
  const tax = calculateTax(subtotal - discount, taxRate);
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: discount,
    tax: tax,
    total: parseFloat((subtotal - discount + tax).toFixed(2))
  };
};

export const getLoyaltyTier = (points) => {
  if (points >= 5000) return LOYALTY_TIERS.DIAMOND;
  if (points >= 2000) return LOYALTY_TIERS.PLATINUM;
  if (points >= 1000) return LOYALTY_TIERS.GOLD;
  if (points >= 500) return LOYALTY_TIERS.SILVER;
  return LOYALTY_TIERS.BRONZE;
};

// UI Utilities
export const getStatusColor = (status) => {
  return ORDER_STATUS_COLORS[status] || 'default';
};

export const showNotification = (type, message, description, duration = 4.5) => {
  notification[type]({
    message,
    description,
    duration,
    placement: 'topRight',
  });
};

export const showSuccessNotification = (message, description) => {
  showNotification('success', message, description);
};

export const showErrorNotification = (message, description) => {
  showNotification('error', message, description);
};

export const showWarningNotification = (message, description) => {
  showNotification('warning', message, description);
};

export const showInfoNotification = (message, description) => {
  showNotification('info', message, description);
};

// Local Storage Utilities
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error writing to localStorage for key "${key}":`, error);
    return false;
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing from localStorage for key "${key}":`, error);
    return false;
  }
};

export const clearStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.warn('Error clearing localStorage:', error);
    return false;
  }
};

// File Utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImageFile = (file) => {
  return file && file.type && file.type.startsWith('image/');
};

export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

// Performance Utilities
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Export all utilities as default
export default {
  // Date utilities
  formatDate,
  getRelativeTime,
  isToday,
  isThisWeek,
  
  // Currency utilities
  formatCurrency,
  parseCurrency,
  formatPercentage,
  formatNumber,
  
  // String utilities
  capitalize,
  camelToTitle,
  slugify,
  truncateText,
  generateId,
  
  // Array/Object utilities
  groupBy,
  sortBy,
  filterBy,
  deepClone,
  isEmpty,
  
  // Validation utilities
  isValidEmail,
  isValidPhone,
  isValidBarcode,
  validateRequired,
  
  // Business logic
  calculateTax,
  calculateDiscount,
  calculateTotal,
  calculateOrderTotal,
  getLoyaltyTier,
  
  // UI utilities
  getStatusColor,
  showNotification,
  showSuccessNotification,
  showErrorNotification,
  showWarningNotification,
  showInfoNotification,
  
  // Storage utilities
  getFromStorage,
  setToStorage,
  removeFromStorage,
  clearStorage,
  
  // File utilities
  formatFileSize,
  isImageFile,
  readFileAsDataURL,
  
  // Performance utilities
  debounce,
  throttle,
};

/*
📁 FILE PATH: frontend/src/utils/helpers.js

📋 DESCRIPTION:
Comprehensive utility functions for common operations in the Enterprise POS system.
Includes date formatting, currency calculations, validation, business logic, and more.

🔧 FEATURES:
- Date and time formatting with relative time support
- Currency formatting and parsing with international support
- String manipulation and validation utilities
- Array/object manipulation and filtering
- Business calculations (tax, discount, totals)
- Loyalty program tier calculations
- Notification helpers for consistent UI feedback
- Local storage utilities with error handling
- File handling and validation
- Performance optimization (debounce, throttle)

🎯 USAGE:
import { formatCurrency, calculateOrderTotal } from '../utils/helpers';
import helpers from '../utils/helpers'; // for full import

⚡ EXAMPLES:
- formatCurrency(1234.56) → "$1,234.56"
- getRelativeTime(new Date()) → "Just now"
- calculateOrderTotal(items, 0.1, 5) → {subtotal, tax, discount, total}
- debounce(searchFunction, 300) → Debounced search
*/