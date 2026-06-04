import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
