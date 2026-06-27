import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '구독다 · 구독 관리 대시보드',
        short_name: '구독다',
        description: '내 구독 서비스의 월 총액·연 환산·다음 결제일을 한눈에. 외화 구독은 실시간 환율로 원화 환산.',
        lang: 'ko',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fafafa',
        theme_color: '#fafafa',
        categories: ['finance', 'productivity', 'utilities'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell so it opens offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        // Exchange-rate APIs: network-first so we use fresh rates when online,
        // but fall back to the last successful response when offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname === 'open.er-api.com' || url.hostname === 'api.frankfurter.app',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'subda-rates',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
