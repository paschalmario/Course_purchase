import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const shouldShimDevtools =
  process.env.NODE_ENV === 'production' || process.env.SKIP_VUE_DEVTOOLS === 'true'

// https://vite.dev/config/
export default defineConfig(() => {
  const config = {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
  }

  if (shouldShimDevtools) {
    config.resolve.alias['@vue/devtools'] = path.resolve(__dirname, 'devtools-shim.js')
    config.resolve.alias['@vue/devtools-kit'] = path.resolve(__dirname, 'devtools-shim.js')
  }

  return config
})
