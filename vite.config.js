import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  base: '/Adam3D/',
  build: {
    outDir: 'build', // Здесь указываем папку для сборки
    emptyOutDir: true // Очищать папку перед сборкой (опционально)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  css: {
    postcss: './postcss.config.cjs'
  }
})