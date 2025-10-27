<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Hero from './Hero.vue'
import CartPage from './CartPage.vue'

// Use local info.json as a fallback if API is not available
import localInfo from '@/info.json'

// initialize reactive courses (clone so we can mutate spaces)
const courses = ref([]) // will be populated by API or fallback

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

// replace placeOrder implementation with server-backed order creation
async function placeOrder(name, phone) {
  if (!name || !phone) {
    alert('Name and phone required')
    return
  }

  // prepare payload
  const items = cart.value.map((i) => ({ id: i.id, quantity: i.quantity || 1 }))
  const payload = { name: String(name).trim(), phone: String(phone).trim(), items }

  try {
    const res = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      const msg = data && data.error ? data.error : `Server returned ${res.status}`
      // if order failed, do not clear cart; server rolls back reservations on failure
      alert('Order failed: ' + msg)
      return
    }

    // After order saved, explicitly update lesson spaces via PUT /api/lessons/:id
    // Use the client-side current courses array to derive new spaces values.
    const updatePromises = []
    for (const cartItem of items) {
      const course = courses.value.find((c) => c.id === cartItem.id)
      if (!course) continue
      // course.spaces already reflects client-side remaining spaces (decremented on addToCart)
      const newSpaces = Number(course.spaces || 0)
      updatePromises.push(
        fetch(`http://localhost:3000/api/lessons/${cartItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaces: newSpaces }),
        }),
      )
    }

    // await all updates (ignore failures individually but log)
    const results = await Promise.allSettled(updatePromises)
    results.forEach((r, idx) => {
      if (r.status === 'rejected') console.error('PUT lesson failed', r.reason)
      else if (r.value && !r.value.ok) console.warn('PUT lesson returned non-ok', idx)
    })

    // success: clear client cart and show confirmation
    cart.value = []
    emitCartUpdated()
    alert(`Order placed successfully (id: ${data.orderId}). Thank you, ${payload.name}!`)
    navigateTo('/')
    // optionally refresh lessons from server
    fetchLessons()
  } catch (err) {
    console.error('Place order failed', err)
    alert('Order request failed. Please try again later.')
  }
}

// fetch initial lessons using GET /api/lessons
async function fetchLessons() {
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/lessons')
    if (!res.ok) throw new Error(`API returned ${res.status}`)
    const data = await res.json()
    courses.value = Array.isArray(data) ? data.map((d) => ({ ...d })) : []
    fetchError.value = ''
  } catch (err) {
    console.error('[Front] Failed to load lessons from API:', err)
    // fallback to local info.json
    courses.value = Array.isArray(localInfo.Courses) ? localInfo.Courses.map((d) => ({ ...d })) : []
    fetchError.value = 'Failed to load lessons from API — using local fallback.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLessons()
})

// SEARCH: debounce + fetch backend /api/search?q=...
let searchTimeout = null
let currentAbort = null
function searchCourses(q) {
  // cancel pending debounce
  if (searchTimeout) clearTimeout(searchTimeout)
  // if empty query, reset to initial list (fetch all or fallback)
  if (!q || !q.trim()) {
    // re-fetch all from API to restore full list (or use local fallback)
    fetch('http://localhost:3000/api/courses')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        courses.value = Array.isArray(data) ? data.map((d) => ({ ...d })) : []
      })
      .catch(() => {
        courses.value = Array.isArray(localInfo.Courses)
          ? localInfo.Courses.map((d) => ({ ...d }))
          : []
      })
    return
  }

  // debounce to avoid too many requests (300ms)
  searchTimeout = setTimeout(() => {
    // abort previous in-flight fetch
    if (currentAbort) currentAbort.abort()
    currentAbort = new AbortController()
    const sig = currentAbort.signal
    const url = `http://localhost:3000/api/search?q=${encodeURIComponent(q)}`
    fetch(url, { signal: sig })
      .then((res) => {
        if (!res.ok) throw new Error(`Search API returned ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // if backend returns empty array, show empty result
        courses.value = Array.isArray(data) ? data.map((d) => ({ ...d })) : []
      })
      .catch((err) => {
        if (err.name === 'AbortError') return // expected on cancellation
        console.error('[Front] Search fetch failed:', err)
        // fallback: perform client-side substring search across subject/location/price/spaces
        const qLower = q.toLowerCase()
        const fallback = (Array.isArray(localInfo.Courses) ? localInfo.Courses : [])
          .filter((c) => {
            return (
              String(c.subject).toLowerCase().includes(qLower) ||
              String(c.location).toLowerCase().includes(qLower) ||
              String(c.price).toLowerCase().includes(qLower) ||
              String(c.spaces).toLowerCase().includes(qLower)
            )
          })
          .map((d) => ({ ...d }))
        courses.value = fallback
      })
      .finally(() => {
        currentAbort = null
      })
  }, 300)
}
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
      <div v-if="loading" class="py-12 text-center text-gray-600">Loading courses…</div>

      <div v-else>
        <div v-if="fetchError" class="mb-4 p-3 bg-yellow-50 border rounded text-yellow-800">
          {{ fetchError }}<br />
          Check server at http://localhost:3000 and run the seed script, or view server logs.
        </div>

        <div v-if="!showCart">
          <!-- show only the lessons list once -->
          <Hero :courses="courses" :onAddToCart="addToCart" @search="searchCourses" />
        </div>

        <div v-else>
          <CartPage
            :cart="cart"
            :onRemove="removeFromCart"
            :onBack="() => navigateTo('/')"
            :onCheckout="placeOrder"
          />
        </div>
      </div>
    </main>
  </div>
</template>
