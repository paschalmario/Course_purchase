import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // ...existing aliases...
      },
    },
    build: {
      target: 'es2018',
    },
    // no devtools plugin, no @vue/devtools alias
  }
})
