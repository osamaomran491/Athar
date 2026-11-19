import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Athar/',
  server: {
    proxy: {
      '/api': {
        target: 'https://dodge-bouncy-dominion.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      }
    }
  }
})