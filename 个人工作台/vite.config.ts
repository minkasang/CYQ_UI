import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 构建配置
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
