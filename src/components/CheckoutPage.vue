<template>
  <div class="max-w-4xl mx-auto p-6">
    <header class="mb-6">
      <h1 class="text-3xl font-semibold text-gray-800">Checkout</h1>
      <p class="text-sm text-gray-500">Provide your details and review your selected courses.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left: form -->
      <section class="md:col-span-1 bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-800 mb-3">Contact details</h2>

        <label class="block text-sm text-gray-600 mb-1">Full name</label>
        <input
          v-model="name"
          type="text"
          placeholder="Your full name"
          class="w-full px-3 py-2 border rounded mb-4 focus:outline-none"
        />

        <label class="block text-sm text-gray-600 mb-1">Phone</label>
        <input
          v-model="phone"
          type="tel"
          placeholder="+44 7000 000000"
          class="w-full px-3 py-2 border rounded mb-4 focus:outline-none"
        />

        <p class="text-xs text-gray-500 mb-4">
          We will use these details for booking confirmation.
        </p>

        <button
          :disabled="!canPlaceOrder"
          @click="placeOrder"
          class="w-full px-4 py-2 rounded text-white"
          :class="
            canPlaceOrder ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
          "
        >
          Place order
        </button>
      </section>

      <!-- Right: cart summary -->
      <section class="md:col-span-2 bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-medium text-gray-800 mb-3">Order summary</h2>

        <div v-if="cart.length === 0" class="text-gray-600 py-8 text-center">
          Your cart is empty.
        </div>

        <ul v-else class="space-y-4">
          <li
            v-for="item in cart"
            :key="item.id"
            class="flex gap-4 items-center p-3 border rounded"
          >
            <img :src="item.image" alt="" class="w-28 h-16 object-cover rounded" />
            <div class="flex-1">
              <h3 class="font-semibold text-gray-800">{{ item.subject }}</h3>
              <p class="text-sm text-gray-500">{{ item.location }}</p>
              <p class="text-sm text-gray-700 mt-1">
                £{{ item.price }} • Spaces: {{ item.spaces }}
              </p>
              <p class="text-sm text-gray-600 mt-1">Qty: {{ item.quantity }}</p>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500">Item total</div>
              <div class="text-lg font-semibold text-gray-800">
                £{{ (item.price * item.quantity).toFixed(2) }}
              </div>
            </div>
          </li>
        </ul>

        <div v-if="cart.length" class="mt-6 flex justify-between items-center">
          <div>
            <p class="text-sm text-gray-500">Subtotal</p>
            <p class="text-2xl font-bold text-gray-800">£{{ total.toFixed(2) }}</p>
          </div>
          <div class="text-right text-sm text-gray-500">
            <p>Payment and confirmation will be handled after placing the order.</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const STORAGE_KEY = 'app_cart_v1'
const cart = ref([])

const name = ref('')
const phone = ref('')

function loadCart() {
  const raw = localStorage.getItem(STORAGE_KEY)
  cart.value = raw ? JSON.parse(raw) : []
}

onMounted(() => {
  loadCart()
})

// simple total
const total = computed(() => cart.value.reduce((s, i) => s + i.price * (i.quantity || 0), 0))

// simple phone validation: digits and optional leading +, length 7-15
const phoneValid = computed(() => /^\+?\d{7,15}$/.test((phone.value || '').replace(/\s+/g, '')))
const canPlaceOrder = computed(
  () => name.value.trim().length >= 2 && phoneValid.value && cart.value.length > 0,
)

function placeOrder() {
  if (!canPlaceOrder.value) return
  // minimal behavior: clear cart and show confirmation (no backend)
  localStorage.removeItem(STORAGE_KEY)
  cart.value = []
  // keep UI feedback minimal — use alert (replace with modal in your app if desired)
  alert(
    `Thank you, ${name.value.trim()}! Your order totaling £${total.value.toFixed(2)} has been placed.`,
  )
  name.value = ''
  phone.value = ''
}
</script>

<style scoped>
/* keep styling aligned with Product/CartPage which use Tailwind; add small helper if needed */
</style>
