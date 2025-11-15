import { createApp } from 'vue'
import { devtools } from '@vue/devtools'
import App from './App.vue'
import './assets/main.css'
import 'primeicons/primeicons.css'

if (process.env.NODE_ENV === 'development') {
  import('@vue/devtools').then((devtools) => {
    devtools.connect()
  })
}

const app = createApp(App)

app.mount('#app')
