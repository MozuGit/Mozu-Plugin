import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'server/static'
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:11451',
        changeOrigin: true
      }
    }
  }
})