// frontend/src/hooks/useLocalStorage.js
import { useState, useEffect, useCallback } from 'react';

const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncAcrossTabs = true,
    expiry = null, // Time in milliseconds
    compress = false
  } = options;

  // Get value from localStorage
  const getStoredValue = useCallback(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }

      let parsedItem;
      if (compress) {
        // Simple compression using base64 (for demo - use proper compression in production)
        const decompressed = atob(item);
        parsedItem = deserialize(decompressed);
      } else {
        parsedItem = deserialize(item);
      }

      // Check expiry
      if (expiry && parsedItem.expiry && Date.now() > parsedItem.expiry) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      return expiry ? parsedItem.value : parsedItem;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize, expiry, compress]);

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Set value to localStorage
  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        let itemToStore;
        
        if (expiry) {
          itemToStore = {
            value: valueToStore,
            expiry: Date.now() + expiry
          };
        } else {
          itemToStore = valueToStore;
        }

        const serialized = serialize(itemToStore);
        
        if (compress) {
          // Simple compression using base64 (for demo - use proper compression in production)
          const compressed = btoa(serialized);
          window.localStorage.setItem(key, compressed);
        } else {
          window.localStorage.setItem(key, serialized);
        }

        // Dispatch custom event for cross-tab synchronization
        if (syncAcrossTabs) {
          window.dispatchEvent(new CustomEvent('localStorage', {
            detail: { key, value: valueToStore }
          }));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, serialize, expiry, compress, syncAcrossTabs]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        
        if (syncAcrossTabs) {
          window.dispatchEvent(new CustomEvent('localStorage', {
            detail: { key, value: undefined }
          }));
        }
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, syncAcrossTabs]);

  // Check if value exists
  const hasValue = useCallback(() => {
    try {
      if (typeof window === 'undefined') return false;
      const item = window.localStorage.getItem(key);
      
      if (item === null) return false;
      
      // Check expiry
      if (expiry) {
        let parsedItem;
        if (compress) {
          const decompressed = atob(item);
          parsedItem = deserialize(decompressed);
        } else {
          parsedItem = deserialize(item);
        }
        
        if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
          window.localStorage.removeItem(key);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.warn(`Error checking localStorage key "${key}":`, error);
      return false;
    }
  }, [key, expiry, compress, deserialize]);

  // Get storage size
  const getStorageSize = useCallback(() => {
    try {
      if (typeof window === 'undefined') return 0;
      const item = window.localStorage.getItem(key);
      return item ? new Blob([item]).size : 0;
    } catch (error) {
      console.warn(`Error getting storage size for key "${key}":`, error);
      return 0;
    }
  }, [key]);

  // Sync across tabs
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.detail.key === key) {
        if (e.detail.value === undefined) {
          setStoredValue(initialValue);
        } else {
          setStoredValue(e.detail.value);
        }
      }
    };

    const handleNativeStorageChange = (e) => {
      if (e.key === key) {
        setStoredValue(getStoredValue());
      }
    };

    // Listen for custom localStorage events (same tab)
    window.addEventListener('localStorage', handleStorageChange);
    
    // Listen for native storage events (other tabs)
    window.addEventListener('storage', handleNativeStorageChange);

    return () => {
      window.removeEventListener('localStorage', handleStorageChange);
      window.removeEventListener('storage', handleNativeStorageChange);
    };
  }, [key, syncAcrossTabs, initialValue, getStoredValue]);

  // Auto-cleanup expired items
  useEffect(() => {
    if (!expiry || typeof window === 'undefined') return;

    const cleanup = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          let parsedItem;
          if (compress) {
            const decompressed = atob(item);
            parsedItem = deserialize(decompressed);
          } else {
            parsedItem = deserialize(item);
          }
          
          if (parsedItem.expiry && Date.now() > parsedItem.expiry) {
            removeValue();
          }
        }
      } catch (error) {
        console.warn(`Error during cleanup for key "${key}":`, error);
      }
    };

    const interval = setInterval(cleanup, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [key, expiry, compress, deserialize, removeValue]);

  // Initialize value if not exists
  useEffect(() => {
    if (!hasValue() && initialValue !== undefined) {
      setValue(initialValue);
    }
  }, []);

  return {
    value: storedValue,
    setValue,
    removeValue,
    hasValue,
    getStorageSize,
    
    // Utility methods
    refresh: () => setStoredValue(getStoredValue()),
    clear: removeValue,
    
    // Metadata
    key,
    isExpired: expiry ? (hasValue() ? false : true) : false,
    size: getStorageSize()
  };
};

// Hook for managing multiple localStorage items
export const useLocalStorageState = (initialState = {}, keyPrefix = 'app_') => {
  const [state, setState] = useState(initialState);

  // Load initial state from localStorage
  useEffect(() => {
    const loadedState = { ...initialState };
    
    Object.keys(initialState).forEach(key => {
      try {
        const storageKey = `${keyPrefix}${key}`;
        const item = localStorage.getItem(storageKey);
        if (item !== null) {
          loadedState[key] = JSON.parse(item);
        }
      } catch (error) {
        console.warn(`Error loading ${key} from localStorage:`, error);
      }
    });
    
    setState(loadedState);
  }, []);

  // Update specific key
  const updateState = useCallback((key, value) => {
    setState(prev => {
      const newState = { ...prev, [key]: value };
      
      // Save to localStorage
      try {
        const storageKey = `${keyPrefix}${key}`;
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
      
      return newState;
    });
  }, [keyPrefix]);

  // Remove specific key
  const removeState = useCallback((key) => {
    setState(prev => {
      const newState = { ...prev };
      delete newState[key];
      
      try {
        const storageKey = `${keyPrefix}${key}`;
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(`Error removing ${key} from localStorage:`, error);
      }
      
      return newState;
    });
  }, [keyPrefix]);

  // Clear all state
  const clearState = useCallback(() => {
    setState(initialState);
    
    Object.keys(state).forEach(key => {
      try {
        const storageKey = `${keyPrefix}${key}`;
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(`Error clearing ${key} from localStorage:`, error);
      }
    });
  }, [initialState, state, keyPrefix]);

  return {
    state,
    updateState,
    removeState,
    clearState,
    setState: (newState) => {
      setState(newState);
      // Save entire state to localStorage
      Object.entries(newState).forEach(([key, value]) => {
        try {
          const storageKey = `${keyPrefix}${key}`;
          localStorage.setItem(storageKey, JSON.stringify(value));
        } catch (error) {
          console.error(`Error saving state to localStorage:`, error);
        }
      });
    }
  };
};

// Cache hook with localStorage
export const useLocalStorageCache = (key, fetcher, options = {}) => {
  const {
    expiry = 5 * 60 * 1000, // 5 minutes default
    revalidateOnFocus = true,
    revalidateOnReconnect = true
  } = options;

  const { value: cachedData, setValue: setCachedData, hasValue } = useLocalStorage(
    key, 
    null, 
    { expiry }
  );

  const [data, setData] = useState(cachedData);
  const [loading, setLoading] = useState(!hasValue());
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (force = false) => {
    if (!force && hasValue() && cachedData) {
      setData(cachedData);
      setLoading(false);
      return cachedData;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
      setCachedData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetcher, hasValue, cachedData, setCachedData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (!hasValue()) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetchData, hasValue]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => {
      fetchData(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    mutate: setData
  };
};

export default useLocalStorage;