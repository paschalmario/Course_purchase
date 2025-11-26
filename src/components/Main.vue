<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import Hero from './Hero.vue'
import CartPage from './CartPage.vue'
import Navbar from './Navbar.vue' // added import
import localInfo from '@/info.json'

// API base (set VITE_API_URL in frontend/.env or default to localhost)
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

const courses = ref([])
const cart = ref([])
const loading = ref(true)
const fetchError = ref('')

// Utility to check and read JSON safely
async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`)
    }
    // Some endpoints may return empty body
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) return await res.json()
    return null
  } catch (err) {
    throw err
  }
}

/* --- Load all lessons --- */
async function loadLessons() {
  loading.value = true
  fetchError.value = ''
  try {
    const data = await fetchJson(`${API_BASE}/api/lessons`)
    if (Array.isArray(data)) courses.value = data.map((d) => ({ ...d }))
    else
      courses.value = Array.isArray(localInfo.Courses)
        ? localInfo.Courses.map((d) => ({ ...d }))
        : []
  } catch (err) {
    console.warn('[Front] loadLessons failed, using local fallback:', err.message)
    fetchError.value = 'Failed to load lessons from API — using local data.'
    courses.value = Array.isArray(localInfo.Courses) ? localInfo.Courses.map((d) => ({ ...d })) : []
  } finally {
    loading.value = false
  }
}

/* --- Search-as-you-type with debounce + abort --- */
let searchTimeout = null
let currentAbort = null
function searchCourses(q) {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (currentAbort) {
    currentAbort.abort()
    currentAbort = null
  }

  // empty query -> reload all lessons
  if (!q || !q.trim()) {
    searchTimeout = setTimeout(() => loadLessons(), 150)
    return
  }

  searchTimeout = setTimeout(async () => {
    currentAbort = new AbortController()
    const sig = currentAbort.signal
    try {
      const url = `${API_BASE}/api/search?q=${encodeURIComponent(q.trim())}`
      const res = await fetch(url, { signal: sig })
      if (!res.ok) throw new Error(`Search API ${res.status}`)
      const data = await res.json()
      courses.value = Array.isArray(data) ? data.map((d) => ({ ...d })) : []
    } catch (err) {
      if (err.name === 'AbortError') return
      console.warn('[Front] search failed, falling back to client filter:', err.message)
      const ql = q.toLowerCase()
      courses.value = (Array.isArray(localInfo.Courses) ? localInfo.Courses : [])
        .filter(
          (c) =>
            String(c.subject).toLowerCase().includes(ql) ||
            String(c.location).toLowerCase().includes(ql) ||
            String(c.price).toLowerCase().includes(ql) ||
            String(c.spaces).toLowerCase().includes(ql),
        )
        .map((d) => ({ ...d }))
    } finally {
      currentAbort = null
    }
  }, 300)
}

/* --- Add to cart (client-side) --- */
function addToCart({ id, quantity = 1 }) {
  const course = courses.value.find((c) => c.id === id)
  if (!course || (course.spaces || 0) <= 0) return
  course.spaces = Math.max(0, (course.spaces || 0) - quantity)
  const existing = cart.value.find((i) => i.id === id)
  if (existing) existing.quantity += quantity
  else
    cart.value.push({
      id: course.id,
      subject: course.subject,
      location: course.location,
      price: course.price,
      image: course.image,
      quantity,
    })
}

/* --- Remove from cart and restore spaces --- */
function removeFromCart(itemId) {
  const idx = cart.value.findIndex((i) => i.id === itemId)
  if (idx === -1) return
  const item = cart.value[idx]
  const course = courses.value.find((c) => c.id === item.id)
  if (course) course.spaces = (course.spaces || 0) + (item.quantity || 0)
  cart.value.splice(idx, 1)
}

/* --- Place Order (POST order, then PUT lesson spaces) --- */
async function placeOrder(name, phone) {
  if (!name || !phone) return
  const items = cart.value.map((i) => ({ id: i.id, quantity: i.quantity || 1 }))
  try {
    const res = await fetchJson(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: String(name).trim(), phone: String(phone).trim(), items }),
    })

    // after order is accepted, sync server-side lesson spaces (PUT)
    await Promise.all(
      cart.value.map((ci) => {
        const course = courses.value.find((c) => c.id === ci.id)
        const newSpaces = course ? Number(course.spaces || 0) : 0
        return fetch(`${API_BASE}/api/lessons/${ci.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaces: newSpaces }),
        })
          .then((r) => {
            if (!r.ok) console.warn(`PUT /lessons/${ci.id} returned ${r.status}`)
            return r
          })
          .catch((err) => console.warn('PUT failed', err))
      }),
    )

    cart.value = []
    alert(`Order placed successfully${res && res.orderId ? ' (id: ' + res.orderId + ')' : ''}`)
    // reload to refresh authoritative data
    await loadLessons()
  } catch (err) {
    console.error('[Front] placeOrder failed:', err.message)
    alert('Order failed: ' + (err.message || 'Unknown error'))
  }
}

/* --- page switching and event listeners --- */
const currentPage = ref('products') // 'products' or 'cart'

function handleNavigate(e) {
  if (!e || !e.detail) return
  if (e.detail === 'cart') {
    currentPage.value = 'cart'
  } else if (e.detail === 'products') {
    currentPage.value = 'products'
    // ensure we fetch fresh data from API when returning to products page
    loadLessons()
  }
}

function handleSearchResults(e) {
  if (!e) return
  const d = e.detail
  if (Array.isArray(d)) {
    courses.value = d.map((x) => ({ ...x }))
  } else if (typeof d === 'string') {
    searchCourses(d)
  }
}

onMounted(() => {
  loadLessons()
  window.addEventListener('navigate', handleNavigate)
  window.addEventListener('searchResults', handleSearchResults)
})

onBeforeUnmount(() => {
  window.removeEventListener('navigate', handleNavigate)
  window.removeEventListener('searchResults', handleSearchResults)
})
</script>

<template>
  <!-- render Navbar at top so Main page shows it -->
  <div>
    <Navbar />
    <div>
      <!-- loading / error UI -->
      <div v-if="loading" class="py-8 text-center text-gray-600">Loading lessons…</div>
      <div v-else>
        <div v-if="fetchError" class="mb-4 text-sm text-yellow-800">{{ fetchError }}</div>

        <!-- Products page -->
        <div v-if="currentPage === 'products'">
          <Hero :courses="courses" @search="searchCourses" @add-to-cart="(p) => addToCart(p)" />
        </div>

        <!-- Cart page (separate page) -->
        <div v-else-if="currentPage === 'cart'">
          <CartPage
            :cart="cart"
            :onRemove="removeFromCart"
            :onBack="() => { currentPage = 'products'; loadLessons() }"
            :onCheckout="placeOrder"
          />
        </div>
      </div>
    </div>
  </div>
</template>
