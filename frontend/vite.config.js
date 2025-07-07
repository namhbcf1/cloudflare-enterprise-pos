import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import eslint from 'vite-plugin-eslint';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react({
        // Enable Fast Refresh
        fastRefresh: true,
        // Include .jsx files
        include: "**/*.{jsx,tsx}",
      }),
      
      // ESLint integration
      eslint({
        include: ['src/**/*.js', 'src/**/*.jsx'],
        exclude: ['node_modules', 'dist'],
        cache: false,
      }),
      
      // PWA Configuration
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.workers\.dev\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                cacheKeyWillBeUsed: async ({ request }) => {
                  return `${request.url}?v=${new Date().getTime()}`;
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: env.VITE_APP_NAME || 'Enterprise POS System',
          short_name: 'EnterprisePOS',
          description: 'Complete Point of Sale system with gamification and AI features',
          theme_color: '#1890ff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['business', 'productivity', 'shopping'],
          lang: 'en',
          icons: [
            {
              src: 'icons/pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png'
            },
            {
              src: 'icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'icons/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          screenshots: [
            {
              src: 'screenshots/desktop-1.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Admin Dashboard'
            },
            {
              src: 'screenshots/mobile-1.png',
              sizes: '360x640',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'POS Terminal'
            }
          ],
          shortcuts: [
            {
              name: 'POS Terminal',
              short_name: 'POS',
              description: 'Open POS Terminal',
              url: '/cashier/pos',
              icons: [{ src: 'icons/pos-shortcut.png', sizes: '96x96' }]
            },
            {
              name: 'Dashboard',
              short_name: 'Dashboard',
              description: 'Open Dashboard',
              url: '/dashboard',
              icons: [{ src: 'icons/dashboard-shortcut.png', sizes: '96x96' }]
            },
            {
              name: 'Products',
              short_name: 'Products',
              description: 'Manage Products',
              url: '/admin/products',
              icons: [{ src: 'icons/products-shortcut.png', sizes: '96x96' }]
            }
          ]
        },
        devOptions: {
          enabled: command === 'serve',
          type: 'module',
          navigateFallback: 'index.html',
        },
      }),
    ],
    
    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@hooks': path.resolve(__dirname, './src/utils/hooks'),
        '@contexts': path.resolve(__dirname, './src/utils/context'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@auth': path.resolve(__dirname, './src/auth'),
        '@routes': path.resolve(__dirname, './src/routes'),
      },
    },
    
    // Development server configuration
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      hmr: {
        port: 24678,
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8787',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:8787',
          ws: true,
          changeOrigin: true,
        },
      },
    },
    
    // Build configuration
    build: {
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'terser' : false,
      
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'antd-vendor': ['antd', '@ant-design/icons', '@ant-design/pro-components'],
            'chart-vendor': ['recharts'],
            'utils-vendor': ['lodash', 'date-fns', 'axios'],
            'animation-vendor': ['framer-motion', 'react-spring'],
            
            // Feature chunks
            'pos-features': [
              './src/pages/cashier',
              './src/components/features/Cart',
              './src/components/features/PaymentTerminal',
              './src/components/features/ProductGrid',
            ],
            'admin-features': [
              './src/pages/admin',
              './src/components/ui/DataTable',
              './src/components/ui/Charts',
            ],
            'gamification-features': [
              './src/pages/staff',
              './src/components/features/GamificationWidgets',
            ],
          },
        },
      },
      
      // Terser options for production
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      
      // Asset optimization
      assetsInlineLimit: 4096, // 4kb
    },
    
    // CSS preprocessing
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            // Ant Design theme customization
            '@primary-color': '#1890ff',
            '@success-color': '#52c41a',
            '@warning-color': '#faad14',
            '@error-color': '#f5222d',
            '@font-size-base': '14px',
            '@border-radius-base': '6px',
            '@box-shadow-base': '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      modules: {
        localsConvention: 'camelCase',
      },
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    
    // Optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
        'axios',
        'lodash',
        'date-fns',
      ],
      exclude: ['@vite/client', '@vite/env'],
    },
    
    // Preview configuration
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
    },
    
    // Experimental features
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },
  };
});