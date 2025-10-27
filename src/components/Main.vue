<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Hero from './Hero.vue'
import CartPage from './CartPage.vue'

// initialize reactive courses (clone so we can mutate spaces)
const courses = ref([]) // initially empty, will fetch from API

// shopping cart: { id, subject, location, price, image, quantity }
const cart = ref([])

// simple history-based routing
const currentPath = ref(window.location.pathname || '/')

function navigateTo(path) {
  if (path === currentPath.value) return
  history.pushState({}, '', path)
  currentPath.value = path
  // optionally focus or scroll to top
  window.scrollTo(0, 0)
}

// cleanup / handle back/forward
function onPopState() {
  currentPath.value = window.location.pathname || '/'
}

onMounted(() => {
  window.addEventListener('popstate', onPopState)
})

onBeforeUnmount(() => {
  window.removeEventListener('popstate', onPopState)
})

// derived view flag
const showCart = computed(() => currentPath.value === '/cart')

const cartCount = computed(() => cart.value.reduce((s, i) => s + (i.quantity || 0), 0))
const cartHasItems = computed(() => cart.value.length > 0)
const total = computed(() => cart.value.reduce((s, i) => s + i.price * (i.quantity || 0), 0))

function emitCartUpdated() {
  window.dispatchEvent(
    new CustomEvent('cart-updated', {
      detail: { cart: cart.value, count: cartCount.value, total: total.value },
    }),
  )
}

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

  emitCartUpdated()
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

  emitCartUpdated()
}

function clearCart() {
  // restore spaces for all items then clear cart
  for (const item of cart.value) {
    const course = courses.value.find((c) => c.id === item.id)
    if (course) course.spaces = (course.spaces || 0) + (item.quantity || 0)
  }
  cart.value = []
  navigateTo('/')

  emitCartUpdated()
}

function placeOrder(name, phone) {
  // minimal confirmation + clear
  alert(`Order submitted for ${name}. Total: £${total.value.toFixed(2)}`)
  clearCart()
}

// fetch courses from API using fetch() promise
onMounted(() => {
  fetch('http://localhost:3000/api/courses')
    .then((res) => {
      if (!res.ok) throw new Error('Failed to fetch courses')
      return res.json()
    })
    .then((data) => {
      // ensure local reactive copies so spaces can be mutated
      courses.value = Array.isArray(data) ? data.map((d) => ({ ...d })) : []
    })
    .catch((err) => {
      console.error('Error loading courses:', err)
      // fallback: you can keep a local copy in src/info.json if needed
    })
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-800">Course Shop</h1>

        <!-- visible cart button navigates to /cart -->
        <nav class="flex items-center gap-3">
          <button
            id="nav-cart"
            class="relative px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            :disabled="!cartHasItems"
            @click="navigateTo('/cart')"
            :aria-pressed="showCart"
          >
            <!-- simple cart icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 7h14l-2-7M10 21a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>

            <span class="hidden sm:inline">
              <span v-if="!showCart">View Cart</span>
              <span v-else>View Lessons</span>
            </span>

            <!-- badge -->
            <span
              v-if="cartHasItems"
              class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
              aria-hidden="true"
            >
              {{ cartCount }}
            </span>
          </button>
        </nav>
      </div>
    </header>

    <main class="container mx-auto px-4 py-8">
      <div v-if="!showCart">
        <!-- show only the lessons list once -->
        <Hero :courses="courses" :onAddToCart="addToCart" />
      </div>

      <div v-else>
        <CartPage
          :cart="cart"
          :onRemove="removeFromCart"
          :onBack="() => navigateTo('/')"
          :onCheckout="placeOrder"
        />
      </div>
    </main>
  </div>
</template>
