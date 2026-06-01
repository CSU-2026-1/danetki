import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/puzzle': 'http://localhost:8000',
      '/parser': 'http://localhost:8000',
    },
  },
})
