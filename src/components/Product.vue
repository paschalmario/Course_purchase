<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['add-to-cart'])

function addToCart() {
  if (!props.item || (props.item.spaces || 0) <= 0) return
  emit('add-to-cart', {
    id: props.item.id,
    subject: props.item.subject,
    location: props.item.location,
    price: props.item.price,
    spaces: props.item.spaces,
    image: props.item.image,
    quantity: 1,
  })
}
</script>

<template>
  <div
    class="subject-card bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-xl hover:-translate-y-1 relative"
  >
    <div class="h-40 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
      <img :src="item.image" alt="" />
    </div>
    <div class="p-4">
      <h3 class="font-bold text-xl mb-2 text-gray-800">{{ item.subject }}</h3>

      <!-- Removed: rating and quantity UI -->
      <p class="text-gray-600 text-base mb-1"><b>Location:</b> {{ item.location }}</p>
      <p class="text-gray-600 text-base mb-4">
        <b>Price:</b>£<span class="product-price">{{ item.price }}</span>
      </p>
      <p class="text-gray-600 text-base mb-4">
        <b>Spaces:</b> <span class="product-stock">{{ item.spaces }}</span>
      </p>

      <!-- Emit Vue event instead of using direct DOM APIs / localStorage -->
      <button
        class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-300 add-to-cart disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!(item.spaces > 0)"
        @click="addToCart"
        aria-disabled="!(item.spaces > 0)"
      >
        Add to cart <i class="fa-solid fa-cart-plus ml-2"></i>
      </button>
    </div>
  </div>
</template>
