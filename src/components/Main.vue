<script setup>
import { ref, computed, onMounted } from 'vue'
import CartPage from './CartPage.vue'
import localInfo from '@/info.json'

/* --- Reactive state --- */
const courses = ref([])
const loading = ref(true)
const fetchError = ref('')

const cart = ref([]) // { id, subject, location, price, image, quantity }
const showCart = ref(false)

/* --- Sorting & Search state --- */
const sortKey = ref('subject') // subject | location | price | spaces
const sortOrder = ref('asc') // asc | desc
const searchTerm = ref('')

/* --- Derived values --- */
const cartCount = computed(() => cart.value.reduce((s, i) => s + (i.quantity || 0), 0))
const cartHasItems = computed(() => cart.value.length > 0)
const total = computed(() => cart.value.reduce((s, i) => s + i.price * (i.quantity || 0), 0))

// Use Vite env var VITE_API_URL (set to your Render/AWS URL in production)
// Example in .env.production: VITE_API_URL="https://yourapp.onrender.com"
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/* --- Helpers: fetch lessons and search --- */
let searchTimeout = null
let currentAbort = null

async function fetchAllLessons() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/lessons`)
    if (!res.ok) throw new Error(`API returned ${res.status}`)
    const data = await res.json()
    courses.value = Array.isArray(data) ? data.map((d) => ({ ...d })) : []
  } catch (err) {
    console.warn('[Main] fetchAllLessons failed, using local fallback', err)
    courses.value = Array.isArray(localInfo.Courses) ? localInfo.Courses.map((d) => ({ ...d })) : []
    fetchError.value = 'Could not load lessons from backend — using local data.'
  } finally {
    loading.value = false
  }
}

function applyClientSort(arr) {
  const order = sortOrder.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return [...arr].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (typeof va === 'string' && typeof vb === 'string') {
      return va.localeCompare(vb) * order
    }
    return (Number(va) - Number(vb)) * order
  })
}

const sortedCourses = computed(() => applyClientSort(courses.value))

function scheduleSearch(q) {
  // clear previous debounce
  if (searchTimeout) clearTimeout(searchTimeout)
  // empty query -> fetch all
  if (!q || !q.trim()) {
    searchTimeout = setTimeout(() => {
      // cancel current fetch if any
      if (currentAbort) {
        currentAbort.abort()
        currentAbort = null
      }
      fetchAllLessons()
    }, 150)
    return
  }

  searchTimeout = setTimeout(() => {
    // abort previous
    if (currentAbort) currentAbort.abort()
    currentAbort = new AbortController()
    const sig = currentAbort.signal
    const url = `${API_BASE}/api/search?q=${encodeURIComponent(q.trim())}`
    fetch(url, { signal: sig })
      .then((res) => {
        if (!res.ok) throw new Error(`Search API returned ${res.status}`)
        return res.json()
      })
      .then((data) => {
        courses.value = Array.isArray(data) ? data.map((d) => ({ ...d })) : []
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        console.warn('[Main] search failed, fallback to local filter', err)
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

/* --- Cart operations --- */
function addToCart(courseId) {
  const course = courses.value.find((c) => c.id === courseId)
  if (!course || (course.spaces || 0) <= 0) return
  // decrement available spaces
  course.spaces = Math.max(0, (course.spaces || 0) - 1)
  // update cart
  const existing = cart.value.find((i) => i.id === courseId)
  if (existing) existing.quantity = (existing.quantity || 0) + 1
  else
    cart.value.push({
      id: course.id,
      subject: course.subject,
      location: course.location,
      price: course.price,
      image: course.image,
      quantity: 1,
    })
}

function removeFromCart(itemId) {
  const idx = cart.value.findIndex((i) => i.id === itemId)
  if (idx === -1) return
  const item = cart.value[idx]
  const course = courses.value.find((c) => c.id === item.id)
  if (course) course.spaces = (course.spaces || 0) + (item.quantity || 0)
  cart.value.splice(idx, 1)
}

async function placeOrder(name, phone) {
  if (!name || !phone) return
  const items = cart.value.map((i) => ({ id: i.id, quantity: i.quantity || 1 }))
  const payload = { name: String(name).trim(), phone: String(phone).trim(), items }

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) {
      const msg = data && data.error ? data.error : `Server returned ${res.status}`
      alert('Order failed: ' + msg)
      return
    }

    // After order saved, update lesson spaces on server via PUT /api/lessons/:id
    const updatePromises = cart.value.map((ci) => {
      const course = courses.value.find((c) => c.id === ci.id)
      const newSpaces = course ? Number(course.spaces || 0) : 0
      return fetch(`${API_BASE}/api/lessons/${ci.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaces: newSpaces }),
      }).then((r) => ({ ok: r.ok, status: r.status }))
    })

    const results = await Promise.allSettled(updatePromises)
    results.forEach((r, idx) => {
      if (r.status === 'rejected') console.error('PUT failed', idx, r.reason)
      else if (r.value && !r.value.ok) console.warn('PUT returned non-ok', idx, r.value.status)
    })

    cart.value = []
    showCart.value = false
    alert(`Order placed successfully (id: ${data.orderId}). Thank you, ${payload.name}!`)
    // refresh lessons from server to ensure consistent state
    fetchAllLessons()
  } catch (err) {
    console.error('Place order failed', err)
    alert('Order request failed. Please try again later.')
  }
}

/* --- Lifecycle --- */
onMounted(() => {
  fetchAllLessons()
})
</script>

<template>
  <div>
    <header class="bg-white shadow">
      <div class="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-800">Course Shop</h1>

        <div class="flex items-center gap-3">
          <button
            id="nav-cart"
            class="relative px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            :disabled="!cartHasItems"
            @click="showCart = !showCart"
            :aria-pressed="showCart"
          >
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
      <div v-if="loading" class="py-12 text-center text-gray-600">Loading lessons…</div>

      <div v-else>
        <div v-if="fetchError" class="mb-4 p-3 bg-yellow-50 border rounded text-yellow-800">
          {{ fetchError }}
        </div>

        <div v-if="!showCart">
          <!-- Search + Sorting -->
          <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="search"
                v-model="searchTerm"
                @input="scheduleSearch(searchTerm)"
                placeholder="Search lessons (subject, location, price, spaces)..."
                class="px-3 py-2 border rounded w-full sm:w-96"
              />
            </div>

            <div class="flex items-center gap-3">
              <label class="text-sm text-gray-600">Sort by</label>
              <select v-model="sortKey" class="px-3 py-2 border rounded bg-white">
                <option value="subject">Subject</option>
                <option value="location">Location</option>
                <option value="price">Price</option>
                <option value="spaces">Spaces</option>
              </select>

              <select v-model="sortOrder" class="px-3 py-2 border rounded bg-white">
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <!-- Lessons list -->
          <section>
            <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <li
                v-for="course in sortedCourses"
                :key="course.id"
                class="bg-white rounded-lg shadow p-4 flex flex-col gap-3"
              >
                <div
                  class="h-36 bg-gray-100 rounded overflow-hidden flex items-center justify-center"
                >
                  <img :src="course.image" alt="" class="w-full h-full object-cover" />
                </div>

                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <i class="fa fa-book text-gray-500"></i> {{ course.subject }}
                  </h3>
                  <p class="text-sm text-gray-600 mt-1">{{ course.location }}</p>
                  <p class="text-sm text-gray-700 mt-2">£{{ course.price }}</p>
                  <p class="text-sm text-gray-500">Spaces: {{ course.spaces }}</p>
                </div>

                <div class="mt-2">
                  <button
                    class="w-full px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!(course.spaces > 0)"
                    @click="addToCart(course.id)"
                    aria-disabled="!(course.spaces > 0)"
                  >
                    Add to cart
                  </button>
                </div>
              </li>
            </ul>
          </section>
        </div>

        <div v-else>
          <CartPage
            :cart="cart"
            :onRemove="removeFromCart"
            :onBack="() => (showCart = false)"
            :onCheckout="placeOrder"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ...existing code... */
</style>
