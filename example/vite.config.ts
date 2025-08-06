import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-print-it': resolve(fileURLToPath(new URL('../src/index.ts', import.meta.url)))
    }
  }
})