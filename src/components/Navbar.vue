<script setup>
import { ref, onBeforeUnmount } from 'vue'

const query = ref('')
let debounceTimer = null

async function doSearch(q) {
  try {
    const qs = encodeURIComponent(q || '')
    const res = await fetch(`/api/search?q=${qs}`)
    const data = res.ok ? await res.json() : []
    // Broadcast results so the products UI can consume them without router
    window.dispatchEvent(new CustomEvent('searchResults', { detail: data }))
  } catch (err) {
    console.error('Search error', err)
    window.dispatchEvent(new CustomEvent('searchResults', { detail: [] }))
  }
}

function onSearchInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const q = (query.value || '').trim()
    // use fetch to query backend and emit results
    doSearch(q)
  }, 300)
}

function openCart() {
  // navigate to cart page (client-side; Main.vue listens for this)
  window.dispatchEvent(new CustomEvent('navigate', { detail: 'cart' }))
}

function openHome() {
  // navigate to products and request a reload
  window.dispatchEvent(new CustomEvent('navigate', { detail: 'products' }))
}

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
})
</script>

<template>
  <header class="bg-blue-600 text-white py-6 shadow-lg">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <!-- clickable heading: triggers client-side navigation to products -->
        <div class="no-underline cursor-pointer" @click="openHome" role="button" aria-label="Home">
          <h1 class="text-3xl font-bold mb-4 md:mb-0">Project</h1>
        </div>

        <div class="flex items-center space-x-4 w-full md:w-auto">
          <div class="relative w-full md:w-64">
            <!-- search input (now performs fetch and emits results) -->
            <input
              id="header-search"
              type="text"
              placeholder="Search subjects..."
              class="w-full px-4 py-2 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
              v-model="query"
              @input="onSearchInput"
              aria-label="Search subjects"
            />
            <button class="absolute right-3 top-2 text-gray-500" aria-label="Search">
              <i class="fas fa-search" aria-hidden="true"></i>
            </button>
          </div>

          <!-- View Cart button: dispatches navigate event -->
          <button
            type="button"
            class="ml-2 inline-flex items-center px-3 py-1 bg-blue-700 text-white rounded"
            @click="openCart"
            aria-label="View Cart"
          >
            View Cart
          </button>
        </div>
      </div>

      <p class="mt-2 text-blue-100">Select a subject to begin your studies</p>

      <nav class="text-blue-100 mt-3 text-sm" aria-label="Breadcrumb">
        <span>Home</span> <span class="mx-2">/</span> <span class="opacity-90">Subjects</span>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* ...existing styles... */
</style>
