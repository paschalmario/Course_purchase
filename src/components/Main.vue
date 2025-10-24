<script setup>
import { ref, computed } from 'vue'
import Hero from './Hero.vue'
import Products from './Products.vue'
import CartPage from './CartPage.vue'
import info from '@/info.json'

// initialize reactive courses (clone so we can mutate spaces)
const courses = ref((info?.Courses || []).map((c) => ({ ...c })))

// shopping cart: { id, subject, location, price, image, quantity }
const cart = ref([])

const showCart = ref(false)

const cartCount = computed(() => cart.value.reduce((s, i) => s + (i.quantity || 0), 0))
const cartHasItems = computed(() => cart.value.length > 0)
const total = computed(() => cart.value.reduce((s, i) => s + i.price * (i.quantity || 0), 0))

function addToCart(courseId) {
  const course = courses.value.find((c) => c.id === courseId)
  if (!course || (course.spaces || 0) <= 0) return

  // decrement available space
  course.spaces = Math.max(0, (course.spaces || 0) - 1)

  // update cart
  const existing = cart.value.find((i) => i.id === courseId)
  if (existing) {
    existing.quantity = (existing.quantity || 0) + 1
  } else {
    cart.value.push({
      id: course.id,
      subject: course.subject,
      location: course.location,
      price: course.price,
      image: course.image,
      quantity: 1,
    })
  }
}

function removeFromCart(itemId) {
  const idx = cart.value.findIndex((i) => i.id === itemId)
  if (idx === -1) return
  const item = cart.value[idx]
  // restore spaces in the course list
  const course = courses.value.find((c) => c.id === item.id)
  if (course) {
    course.spaces = (course.spaces || 0) + (item.quantity || 0)
  }
  // remove from cart
  cart.value.splice(idx, 1)
}

function clearCart() {
  // restore spaces for all items then clear cart
  for (const item of cart.value) {
    const course = courses.value.find((c) => c.id === item.id)
    if (course) course.spaces = (course.spaces || 0) + (item.quantity || 0)
  }
  cart.value = []
  showCart.value = false
}

function placeOrder(name, phone) {
  // assume validation already done by CartPage; display confirmation + clear
  alert(`Order submitted for ${name}. Total: £${total.value.toFixed(2)}`)
  clearCart()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-800">Course Shop</h1>

        <div class="flex items-center gap-3">
          <button
            class="relative px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!cartHasItems"
            @click="showCart = !showCart"
            aria-pressed="showCart"
          >
            <span v-if="!showCart">View Cart</span>
            <span v-else>View Lessons</span>

            <span
              v-if="cartHasItems"
              class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
              aria-hidden="true"
            >
              {{ cartCount }}
            </span>
          </button>
        </div>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <div v-if="!showCart">
        <!-- pass courses and handler to Hero; Products remains below -->
        <Hero :courses="courses" :onAddToCart="addToCart" />
        <Products />
      </div>

      <div v-else>
        <CartPage
          :cart="cart"
          :onRemove="removeFromCart"
          :onBack="() => (showCart = false)"
          :onCheckout="placeOrder"
        />
      </div>
    </main>
  </div>
</template>
