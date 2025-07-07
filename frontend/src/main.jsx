/**
 * ============================================================================
 * MAIN ENTRY POINT - REACT APPLICATION BOOTSTRAP
 * ============================================================================
 * Initializes the React application with all providers and configurations
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ConfigProvider } from 'antd';
import { HelmetProvider } from 'react-helmet-async';
import enUS from 'antd/locale/en_US';

// Import main app component
import App from './App.jsx';

// Import global styles
import './index.css';

// Import providers and contexts
import { AuthProvider } from '@auth/AuthContext.jsx';
import { ThemeProvider } from '@contexts/ThemeContext.jsx';
import { NotificationProvider } from '@contexts/NotificationContext.jsx';
import { WebSocketProvider } from '@contexts/WebSocketContext.jsx';
import { CartProvider } from '@contexts/CartContext.jsx';
import { GameProvider } from '@contexts/GameContext.jsx';
import { OfflineProvider } from '@contexts/OfflineContext.jsx';
import { SettingsProvider } from '@contexts/SettingsContext.jsx';

// Import utilities
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from '@components/common/ErrorBoundary.jsx';
import { GlobalErrorHandler } from '@utils/errorHandler.js';
import { performanceMonitor } from '@utils/performance.js';
import { initializeApp } from '@utils/appInitializer.js';

// Configure React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Configure Ant Design theme
const antdTheme = {
  token: {
    // Color tokens
    colorPrimary: import.meta.env.VITE_PRIMARY_COLOR || '#1890ff',
    colorSuccess: import.meta.env.VITE_SUCCESS_COLOR || '#52c41a',
    colorWarning: import.meta.env.VITE_WARNING_COLOR || '#faad14',
    colorError: import.meta.env.VITE_ERROR_COLOR || '#f5222d',
    
    // Layout tokens
    borderRadius: 6,
    wireframe: false,
    
    // Typography tokens
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    
    // Animation tokens
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',
  },
  components: {
    // Customize specific components
    Button: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
    },
    Card: {
      borderRadius: 8,
      paddingLG: 24,
    },
    Table: {
      borderRadius: 8,
    },
    Modal: {
      borderRadius: 8,
    },
    Drawer: {
      borderRadius: 8,
    },
  },
  algorithm: import.meta.env.VITE_DEFAULT_THEME === 'dark' ? 'darkAlgorithm' : 'defaultAlgorithm',
};

// Service Worker registration
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(registration) {
    console.log('SW Registered: ', registration);
  },
  onRegisterError(error) {
    console.log('SW registration error', error);
  },
});

// Global error handler setup
GlobalErrorHandler.init({
  onError: (error, errorInfo) => {
    console.error('Global error caught:', error, errorInfo);
    
    // Log to external service in production
    if (import.meta.env.PROD) {
      // Send to error reporting service
      // Example: Sentry, LogRocket, etc.
    }
  },
  enableConsoleLog: import.meta.env.DEV,
  enableNotification: true,
});

// Performance monitoring
if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
  performanceMonitor.init({
    trackPageViews: true,
    trackUserInteractions: true,
    trackPerformanceMetrics: true,
    reportInterval: 30000, // 30 seconds
  });
}

// App initialization
initializeApp({
  enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
})
  .then(() => {
    console.log('App initialization completed');
  })
  .catch((error) => {
    console.error('App initialization failed:', error);
  });

// Root component with all providers
const AppWithProviders = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider 
            theme={antdTheme}
            locale={enUS}
            componentSize="middle"
          >
            <ThemeProvider>
              <AuthProvider>
                <SettingsProvider>
                  <NotificationProvider>
                    <WebSocketProvider>
                      <OfflineProvider>
                        <CartProvider>
                          <GameProvider>
                            <App />
                          </GameProvider>
                        </CartProvider>
                      </OfflineProvider>
                    </WebSocketProvider>
                  </NotificationProvider>
                </SettingsProvider>
              </AuthProvider>
            </ThemeProvider>
          </ConfigProvider>
          
          {/* React Query DevTools - only in development */}
          {import.meta.env.DEV && (
            <ReactQueryDevtools 
              initialIsOpen={false}
              position="bottom-right"
            />
          )}
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </ErrorBoundary>
);

// Render the application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Strict mode for development
if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <AppWithProviders />
    </React.StrictMode>
  );
} else {
  root.render(<AppWithProviders />);
}

// Hot Module Replacement (HMR) for development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Development helpers
if (import.meta.env.DEV) {
  // Expose useful objects to window for debugging
  window.__QUERY_CLIENT__ = queryClient;
  
  // Performance logging
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.group('🚀 Performance Metrics');
    console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart, 'ms');
    console.log('Load Complete:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
    console.log('Total Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
    console.groupEnd();
  });
  
  // Memory usage monitoring
  if ('memory' in performance) {
    setInterval(() => {
      const memory = performance.memory;
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
        console.warn('High memory usage detected:', {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
        });
      }
    }, 30000); // Check every 30 seconds
  }
}

// Register global event listeners
window.addEventListener('online', () => {
  console.log('App is back online');
  queryClient.refetchQueries();
});

window.addEventListener('offline', () => {
  console.log('App is offline');
});

// Prevent default behavior for drag and drop
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => e.preventDefault());

// Custom console styling for branding
if (import.meta.env.DEV) {
  console.log(
    '%c🏪 Enterprise POS System %c🚀 Development Mode',
    'background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold;',
    'background: #52c41a; color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold; margin-left: 8px;'
  );
  
  console.log(
    '%cWelcome to the Enterprise POS System! 🎉\n\n' +
    '🔧 Available debugging tools:\n' +
    '• window.__QUERY_CLIENT__ - React Query client\n' +
    '• React DevTools extension\n' +
    '• Redux DevTools (if enabled)\n\n' +
    '📖 Documentation: https://github.com/yourusername/cloudflare-enterprise-pos\n' +
    '🐛 Issues: https://github.com/yourusername/cloudflare-enterprise-pos/issues\n' +
    '💬 Support: ' + (import.meta.env.VITE_SUPPORT_EMAIL || 'support@yourcompany.com'),
    'color: #1890ff; font-size: 12px; line-height: 1.5;'
  );
}

// Export for testing purposes
export { queryClient, antdTheme };