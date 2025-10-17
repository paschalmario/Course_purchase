<script setup></script>
<template>
  <div class="mb-8 text-center">
    <h2 class="text-2xl font-semibold text-gray-800 mb-2">Explore Subjects</h2>
    <p class="text-gray-600 max-w-2xl mx-auto">
      Browse through our extensive collection of JAMB subjects. Click on any subject to access study
      materials, past questions, and tutorials.
    </p>
  </div>

  <!-- Filters: search (filter), price-range (radios), location (radios) -->
  <div class="mb-6 flex flex-col md:flex-row md:items-end md:space-x-4 gap-3">
    <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label class="text-sm text-gray-600 block mb-1">Search</label>
        <input
          id="search-input"
          type="text"
          placeholder="Search subjects..."
          class="w-full px-3 py-2 border rounded text-gray-800 focus:outline-none"
        />
      </div>

      <!-- Replaced price min/max with radio group -->
      <div class="sm:col-span-2">
        <label class="text-sm text-gray-600 block mb-1">Price range</label>
        <div class="flex flex-wrap gap-2">
          <label class="inline-flex items-center text-sm">
            <input type="radio" name="price-range" value="any" checked class="mr-2" />
            Any
          </label>
          <label class="inline-flex items-center text-sm">
            <input type="radio" name="price-range" value="0-250" class="mr-2" />
            £0 - £250
          </label>
          <label class="inline-flex items-center text-sm">
            <input type="radio" name="price-range" value="251-500" class="mr-2" />
            £251 - £500
          </label>
          <label class="inline-flex items-center text-sm">
            <input type="radio" name="price-range" value="501-1000" class="mr-2" />
            £501 - £1000
          </label>
        </div>
      </div>
    </div>

    <!-- Replaced location select with radio group -->
    <div class="w-64">
      <label class="text-sm text-gray-600 block mb-1">Location</label>
      <div class="flex flex-col gap-2">
        <label class="inline-flex items-center text-sm">
          <input type="radio" name="location" value="" checked class="mr-2" />
          All
        </label>
        <label class="inline-flex items-center text-sm">
          <input type="radio" name="location" value="London" class="mr-2" />
          London
        </label>
        <!-- add other locations here if needed -->
      </div>
    </div>

    <div class="flex items-center space-x-2">
      <button id="apply-filters" class="px-4 py-2 bg-blue-600 text-white rounded">Apply</button>
      <button id="reset-filters" class="px-4 py-2 bg-gray-200 text-gray-700 rounded">Reset</button>
    </div>
  </div>
</template>
