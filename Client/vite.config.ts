import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TravelLink',
        short_name: 'TravelLink',
        description: 'Your ultimate travel and expense companion',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone'
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7150',
        changeOrigin: true,
        secure: false,  // allows self-signed dev certificates
      },
      '/hubs': {
        target: 'https://localhost:7150',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
