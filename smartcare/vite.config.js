import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,json}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'document' ||
              url.pathname.endsWith('.json'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'smartcare-static',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: [...configDefaults.exclude, 'tests/**', 'test-results/**'],
  },
})
