import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// Set the Vite base option to your repo name for GitHub Pages.
// Replace 'Course_purchase_FrontEnd' with your actual repo name if different.
export default defineConfig({
  base: '/Course_purchase_FrontEnd/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2018',
  },
})
