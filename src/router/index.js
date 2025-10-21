import { createRouter, createWebHistory } from 'vue-router'
import Homeview from '@/view/Homeview.vue'
import CartView from '@/view/CartView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Homeview,
    },
    {
      path: '/cart',
      name: 'Cart',
      component: CartView,
    },
  ],
})

export default router
