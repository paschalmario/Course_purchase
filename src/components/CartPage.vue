<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  cart: { type: Array, required: true },
  onRemove: { type: Function, required: true },
  onBack: { type: Function, required: true },
  onCheckout: { type: Function, required: true },
})

const name = ref('')
const phone = ref('')
const confirmation = ref('')

const nameValid = computed(() => /^[A-Za-z\s]{2,}$/.test(name.value.trim()))
const phoneValid = computed(() => /^\d{7,15}$/.test(phone.value.trim()))
const canCheckout = computed(() => nameValid.value && phoneValid.value && props.cart.length > 0)
const total = computed(() => props.cart.reduce((s, i) => s + i.price * (i.quantity || 0), 0))

function handleCheckout() {
  if (!canCheckout.value) return
  props.onCheckout(name.value.trim(), phone.value.trim())
  confirmation.value = `Thank you, ${name.value.trim()}! Order submitted.`
  name.value = ''
  phone.value = ''
}
</script>

<template>
  <div class="cart-page p-4 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">Your Cart</h2>
      <div class="flex items-center gap-2">
        <button class="px-3 py-2 bg-gray-200 rounded" @click="props.onBack">Back to lessons</button>
      </div>
    </div>

    <div v-if="props.cart.length === 0" class="text-gray-600 py-8 text-center">
      Your cart is empty.
    </div>

    <ul v-else class="space-y-4 mb-6">
      <li
        v-for="item in props.cart"
        :key="item.id"
        class="flex gap-4 items-center p-3 border rounded bg-white"
      >
        <img :src="item.image" alt="" class="w-24 h-16 object-cover rounded" />
        <div class="flex-1">
          <h3 class="font-semibold">{{ item.subject }}</h3>
          <p class="text-sm text-gray-600">{{ item.location }}</p>
          <p class="text-sm text-gray-700 mt-1">£{{ item.price }} • Qty: {{ item.quantity }}</p>
        </div>

        <div class="text-right">
          <div class="text-lg font-semibold">£{{ (item.price * item.quantity).toFixed(2) }}</div>
          <button class="text-sm text-red-600 mt-2" @click="props.onRemove(item.id)">Remove</button>
        </div>
      </li>
    </ul>

    <!-- Checkout form -->
    <aside class="bg-white p-4 rounded-lg shadow">
      <h3 class="text-lg font-medium mb-3">Checkout</h3>

      <div
        v-if="confirmation"
        class="mb-4 p-3 rounded bg-green-50 border border-green-100 text-green-800"
      >
        {{ confirmation }}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="text-sm text-gray-600 block mb-1">Full name</label>
          <input
            v-model="name"
            type="text"
            class="w-full px-3 py-2 border rounded"
            placeholder="Letters only"
          />
          <p v-if="name && !nameValid" class="text-xs text-red-600 mt-1">
            Name must be letters only (min 2).
          </p>
        </div>

        <div>
          <label class="text-sm text-gray-600 block mb-1">Phone</label>
          <input
            v-model="phone"
            type="tel"
            class="w-full px-3 py-2 border rounded"
            placeholder="Numbers only"
          />
          <p v-if="phone && !phoneValid" class="text-xs text-red-600 mt-1">
            Phone must be numbers only (7-15 digits).
          </p>
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <div>
          <div class="text-sm text-gray-500">Total</div>
          <div class="text-2xl font-bold">£{{ total.toFixed(2) }}</div>
        </div>

        <div class="flex gap-2">
          <button class="px-4 py-2 bg-gray-200 rounded" @click="props.onBack">
            Continue shopping
          </button>
          <button
            class="px-4 py-2 rounded text-white"
            :class="
              canCheckout ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
            "
            :disabled="!canCheckout"
            @click="handleCheckout"
          >
            Checkout
          </button>
        </div>
      </div>
    </aside>
  </div>
</template>
