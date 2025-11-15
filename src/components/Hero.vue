<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  courses: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['search', 'add-to-cart'])

// local state
const sortKey = ref('subject') // subject|location|price|spaces
const sortOrder = ref('asc') // asc|desc
const searchTerm = ref('')

function onSearchInput(e) {
  const v = e.target.value
  searchTerm.value = v
  emit('search', v)
}

// computed sorted & filtered list (filters performed upstream if you want backend search)
// here we just sort the passed-in courses (search handled by parent via fetch)
const sortedCourses = computed(() => {
  const arr = Array.isArray(props.courses) ? [...props.courses] : []
  const order = sortOrder.value === 'asc' ? 1 : -1
  const key = sortKey.value
  return arr.sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (typeof va === 'string' && typeof vb === 'string') {
      return va.localeCompare(vb) * order
    }
    return (Number(va) - Number(vb)) * order
  })
})

function onAdd(id) {
  emit('add-to-cart', { id, quantity: 1 })
}
</script>

<template>
  <div class="mb-8">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-semibold text-gray-800 mb-2">Explore Subjects</h2>
      <p class="text-gray-600 max-w-2xl mx-auto">
        Browse our lessons. Use the controls below to sort or search.
      </p>
    </div>

    <!-- Search + Sorting controls -->
    <div class="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div class="flex items-center gap-3 w-full sm:w-auto">
        <label class="sr-only">Search</label>
        <input
          type="search"
          :value="searchTerm"
          @input="onSearchInput"
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

    <!-- Lessons list (v-for) -->
    <section>
      <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <li
          v-for="course in sortedCourses"
          :key="course.id"
          class="bg-white rounded-lg shadow p-4 flex flex-col gap-3"
        >
          <div class="h-36 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
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
            <!-- button always visible; disabled when no spaces; uses provided handler -->
            <button
              class="w-full px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!(course.spaces > 0)"
              @click="onAdd(course.id)"
              aria-disabled="!(course.spaces > 0)"
            >
              Add to cart
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
