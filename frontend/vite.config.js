import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['campus-icon.svg'],
      manifest: {
        name: 'CampusConnect',
        short_name: 'CampusConnect',
        description: 'Unified campus operations and communication platform',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/campus-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,ico,png,webp}']
      }
    })
  ],
  server: {
    port: 5173
  }
});
