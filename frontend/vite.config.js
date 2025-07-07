// frontend/vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import eslint from 'vite-plugin-eslint';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command, mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    // Base configuration
    base: '/',
    
    // Plugins
    plugins: [
      // React with SWC (faster than Babel)
      react({
        // Enable React Fast Refresh
        fastRefresh: true,
        // JSX Runtime automatic
        jsxImportSource: '@emotion/react',
      }),

      // ESLint integration
      eslint({
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: ['node_modules', 'dist'],
        failOnError: isProduction,
        failOnWarning: false,
      }),

      // Progressive Web App
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            // API calls
            {
              urlPattern: /^https:\/\/.*\.workers\.dev\/api\/.*/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            // Images
            {
              urlPattern: /\.(png|jpg|jpeg|svg|webp|gif)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            // Fonts
            {
              urlPattern: /\.(woff|woff2|ttf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
            // Static assets
            {
              urlPattern: /\.(css|js)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-assets',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
          ],
          skipWaiting: true,
          clientsClaim: true,
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],
        manifest: {
          name: 'Cloudflare Enterprise POS',
          short_name: 'CF POS',
          description: '100% FREE enterprise-grade Point of Sale system built on Cloudflare edge',
          theme_color: '#1890ff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          lang: 'vi-VN',
          icons: [
            {
              src: 'icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable any',
            },
            {
              src: 'icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable any',
            },
            {
              src: 'icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: 'icons/icon-256x256.png',
              sizes: '256x256',
              type: 'image/png',
            },
            {
              src: 'icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
            },
          ],
          shortcuts: [
            {
              name: 'POS Terminal',
              short_name: 'Terminal',
              description: 'Mở máy tính tiền',
              url: '/cashier/pos',
              icons: [
                {
                  src: 'icons/shortcut-pos.png',
                  sizes: '96x96',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Quản lý sản phẩm',
              short_name: 'Sản phẩm',
              description: 'Quản lý kho và sản phẩm',
              url: '/admin/products',
              icons: [
                {
                  src: 'icons/shortcut-products.png',
                  sizes: '96x96',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Báo cáo doanh thu',
              short_name: 'Báo cáo',
              description: 'Xem báo cáo và analytics',
              url: '/admin/reports',
              icons: [
                {
                  src: 'icons/shortcut-reports.png',
                  sizes: '96x96',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Bảng xếp hạng',
              short_name: 'Leaderboard',
              description: 'Xem bảng xếp hạng nhân viên',
              url: '/staff/leaderboard',
              icons: [
                {
                  src: 'icons/shortcut-leaderboard.png',
                  sizes: '96x96',
                  type: 'image/png',
                },
              ],
            },
          ],
          categories: ['business', 'productivity', 'finance'],
          screenshots: [
            {
              src: 'screenshots/pos-terminal-desktop.png',
              sizes: '1280x800',
              type: 'image/png',
              platform: 'wide',
              label: 'POS Terminal trên desktop',
            },
            {
              src: 'screenshots/pos-terminal-mobile.png',
              sizes: '400x800',
              type: 'image/png',
              platform: 'narrow',
              label: 'POS Terminal trên mobile',
            },
          ],
        },
        devOptions: {
          enabled: !isProduction,
          type: 'module',
        },
      }),

      // Bundle analyzer for production builds
      isAnalyze &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),

    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@/components': resolve(__dirname, 'src/components'),
        '@/pages': resolve(__dirname, 'src/pages'),
        '@/hooks': resolve(__dirname, 'src/hooks'),
        '@/utils': resolve(__dirname, 'src/utils'),
        '@/services': resolve(__dirname, 'src/services'),
        '@/auth': resolve(__dirname, 'src/auth'),
        '@/assets': resolve(__dirname, 'src/assets'),
        '@/styles': resolve(__dirname, 'src/styles'),
        '@/types': resolve(__dirname, 'src/types'),
        '@/constants': resolve(__dirname, 'src/constants'),
      },
    },

    // Development server
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      cors: true,
      proxy: {
        // Proxy API calls to backend
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8787',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
        // WebSocket proxy for real-time features
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:8787',
          ws: true,
          changeOrigin: true,
        },
      },
    },

    // Preview server (for production builds)
    preview: {
      port: 4173,
      host: '0.0.0.0',
      strictPort: true,
      cors: true,
    },

    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            vendor: ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons', '@ant-design/colors'],
            charts: ['recharts', 'chart.js', 'react-chartjs-2'],
            utils: ['lodash-es', 'dayjs', 'axios'],
            animations: ['framer-motion', 'lottie-react'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    // Optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
        'recharts',
        'dayjs',
        'lodash-es',
        'axios',
      ],
      exclude: ['@vite/client', '@vite/env'],
    },

    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __GIT_COMMIT__: JSON.stringify(process.env.GITHUB_SHA || 'development'),
    },

    // CSS configuration
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "@/styles/variables.scss";
            @import "@/styles/mixins.scss";
          `,
        },
      },
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
          ...(isProduction
            ? [
                require('cssnano')({
                  preset: 'default',
                }),
              ]
            : []),
        ],
      },
    },

    // Test configuration
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.{js,ts}',
          '**/dist/',
        ],
      },
    },

    // Worker configuration for PWA
    worker: {
      format: 'es',
      plugins: [react()],
    },

    // Performance settings
    esbuild: {
      target: 'es2020',
      logLevel: 'info',
      legalComments: 'none',
    },

    // Cloudflare Pages specific
    envPrefix: 'VITE_',
  };
});

// Additional Vite configurations for different environments
export const stagingConfig = defineConfig({
  define: {
    __ENVIRONMENT__: JSON.stringify('staging'),
  },
  build: {
    sourcemap: true,
    minify: true,
  },
});

export const productionConfig = defineConfig({
  define: {
    __ENVIRONMENT__: JSON.stringify('production'),
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
      },
    },
  },
});