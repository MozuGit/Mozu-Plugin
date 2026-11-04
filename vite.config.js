import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: 'web',
  plugins: [vue()],
  build: {
    outDir: '../server/static',
    emptyOutDir: true,
    copyPublicDir: false,
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
