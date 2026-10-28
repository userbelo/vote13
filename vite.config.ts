import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/freepay': {
        target: 'https://api.freepaybrasil.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/freepay/, ''),
        secure: true,
      },
    },
  },
})
