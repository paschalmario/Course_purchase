<script setup>
import { ref } from 'vue'
import ProductData from '@/info.json'
import Product from './Product.vue'

let items = ref(ProductData.Courses)
</script>
<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    id="products-grid"
  >
    <Product v-for="item in items" :key="item.id" :item="item" />
  </div>
</template>
