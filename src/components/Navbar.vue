<script setup>
import { RouterLink } from 'vue-router'
</script>
<template>
  <header class="bg-blue-600 text-white py-6 shadow-lg">
    <div class="container mx-auto px-4">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <RouterLink to="/"><h1 class="text-3xl font-bold mb-4 md:mb-0">Project</h1></RouterLink>
        <div class="flex items-center space-x-4 w-full md:w-auto">
          <div class="relative w-full md:w-64">
            <!-- Changed id to avoid duplicate with filter search -->
            <input
              id="header-search"
              type="text"
              placeholder="Search subjects..."
              class="w-full px-4 py-2 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button class="absolute right-3 top-2 text-gray-500">
              <i class="fas fa-search"></i>
            </button>
          </div>

          <!-- Added: Cart button -->
          <div class="relative">
            <RouterLink
              to="/cart"
              id="cart-button"
              class="bg-white text-blue-600 px-3 py-2 rounded-full flex items-center space-x-2 shadow-sm hover:bg-gray-100 transition"
            >
              <!-- Inline SVG cart (no external icon dependency) -->
              <svg
                class="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.5L6 6z" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>

              <span class="hidden md:inline">Cart</span>
            </RouterLink>
            <span id="cart-count" class="cart-badge" style="display: none">0</span>
          </div>
        </div>
      </div>
      <p class="mt-2 text-blue-100">Select a subject to begin your studies</p>

      <!-- Added: simple breadcrumb -->
      <nav class="text-blue-100 mt-3 text-sm" aria-label="Breadcrumb">
        <span>Home</span> <span class="mx-2">/</span> <span class="opacity-90">Subjects</span>
      </nav>
    </div>
  </header>
</template>
