import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'server/static',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/index.js',
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name.split('.').pop()
          if (['css'].includes(ext)) {
            return 'assets/index.css'
          }
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) {
            return 'assets/index.[ext]'
          }
          return 'assets/index.[ext]'
        }
      }
    }
  }
})