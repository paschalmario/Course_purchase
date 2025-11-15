import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

// only try to load devtools in development and in a browser environment
if (import.meta.env.DEV && typeof window !== 'undefined') {
  import('@vue/devtools')
    .then((devtools) => {
      if (devtools && typeof devtools.setupDevtools === 'function') {
        try {
          devtools.setupDevtools({ app })
        } catch (e) {
          /* ignore */
        }
      }
    })
    .catch(() => {
      // optional: ignore missing devtools in environments where it's not installed
    })
}

app.mount('#app')
