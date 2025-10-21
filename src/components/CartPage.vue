<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const STORAGE_KEY = 'app_cart_v1'
const cart = ref([])

function loadCart() {
  const raw = localStorage.getItem(STORAGE_KEY)
  cart.value = raw ? JSON.parse(raw) : []
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.value))
}

function increment(item) {
  if (item.quantity < (item.spaces || Infinity)) {
    item.quantity++
    saveCart()
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart.value }))
  }
}

function decrement(item) {
  if (item.quantity > 1) {
    item.quantity--
    saveCart()
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart.value }))
  } else {
    removeItem(item)
  }
}

function removeItem(item) {
  cart.value = cart.value.filter((i) => i.id !== item.id)
  saveCart()
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart.value }))
}

function clearCart() {
  cart.value = []
  saveCart()
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart.value }))
}

const total = computed(() => cart.value.reduce((s, i) => s + i.price * (i.quantity || 0), 0))

let handler = null
onMounted(() => {
  loadCart()
  handler = (e) => {
    if (e && e.detail) cart.value = e.detail
  }
  window.addEventListener('cart-updated', handler)
  window.addEventListener('storage', loadCart)
})

onBeforeUnmount(() => {
  if (handler) window.removeEventListener('cart-updated', handler)
  window.removeEventListener('storage', loadCart)
})
</script>

<template>
  <div class="cart-page p-4">
    <h2 class="text-2xl font-bold mb-4">Your Cart</h2>

    <div v-if="cart.length === 0" class="text-gray-600">Cart is empty.</div>

    <ul v-else class="space-y-4">
      <li v-for="item in cart" :key="item.id" class="flex gap-4 items-center p-3 border rounded">
        <img :src="item.image" alt="" class="w-24 h-16 object-cover rounded" />
        <div class="flex-1">
          <h3 class="font-semibold">{{ item.subject }}</h3>
          <p class="text-sm text-gray-600">{{ item.location }}</p>
          <p class="text-sm"><b>Price:</b> £{{ item.price }}</p>
          <p class="text-sm"><b>Spaces available:</b> {{ item.spaces }}</p>
        </div>

        <div class="flex items-center gap-2">
          <button class="px-2 py-1 bg-gray-200 rounded" @click="decrement(item)">-</button>
          <span class="w-8 text-center">{{ item.quantity }}</span>
          <button class="px-2 py-1 bg-gray-200 rounded" @click="increment(item)">+</button>
        </div>

        <div class="text-right">
          <p class="font-semibold">£{{ (item.price * item.quantity).toFixed(2) }}</p>
          <button class="text-sm text-red-600 mt-2" @click="removeItem(item)">Remove</button>
        </div>
      </li>
    </ul>

    <div v-if="cart.length" class="mt-6 flex justify-between items-center">
      <div>
        <button class="px-3 py-1 bg-red-500 text-white rounded" @click="clearCart">
          Clear cart
        </button>
      </div>
      <div class="text-right">
        <p class="text-lg">
          Total: <span class="font-bold">£{{ total.toFixed(2) }}</span>
        </p>
      </div>
    </div>
  </div>
</template>
