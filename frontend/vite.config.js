import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/upload': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/progress': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/send_emails': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/cancel_emails': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/send_test_email': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
