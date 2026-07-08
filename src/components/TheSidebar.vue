<script setup lang="ts">
import type { CategoryOption } from '../types'

defineProps<{
  categories: CategoryOption[]
  mobileOpen: boolean
  selectedCategoryIds: string[]
}>()

const emit = defineEmits<{
  (event: 'close-menu'): void
  (event: 'toggle-category', categoryId: string): void
}>()

function isSelected(categoryId: string, selectedCategoryIds: string[]): boolean {
  return selectedCategoryIds.includes(categoryId)
}
</script>

<template>
  <aside class="category-sidebar d-none d-lg-flex border-end">
    <div class="category-scroll">
      <div class="px-4 py-3 border-bottom">
        <h2 class="h6 mb-0">Categories</h2>
      </div>

      <div v-if="categories.length > 0" class="category-list p-3" aria-label="Recipe categories">
        <label
          v-for="category in categories"
          :key="category.id"
          class="category-row"
          :class="{ 'is-selected': isSelected(category.id, selectedCategoryIds) }"
        >
          <input
            class="form-check-input"
            type="checkbox"
            :checked="isSelected(category.id, selectedCategoryIds)"
            @change="emit('toggle-category', category.id)"
          />
          <span class="category-name">{{ category.name }}</span>
          <span class="badge text-bg-light border">{{ category.count }}</span>
        </label>
      </div>

      <p v-else class="small text-secondary p-4 mb-0">Add a category when you need one.</p>
    </div>

  </aside>

  <div v-if="mobileOpen" class="mobile-menu d-lg-none" role="dialog" aria-modal="true" aria-label="Categories">
    <div class="mobile-menu-header border-bottom">
      <div>
        <h2 class="h5 mb-0">Categories</h2>
        <p class="small text-secondary mb-0">Filter your recipes</p>
      </div>
      <button class="btn btn-link icon-button" type="button" aria-label="Close categories" @click="emit('close-menu')">
        <span class="material-icons" aria-hidden="true">close</span>
      </button>
    </div>

    <div class="mobile-menu-body">
      <div v-if="categories.length > 0" class="category-list p-3" aria-label="Recipe categories">
        <label
          v-for="category in categories"
          :key="category.id"
          class="category-row"
          :class="{ 'is-selected': isSelected(category.id, selectedCategoryIds) }"
        >
          <input
            class="form-check-input"
            type="checkbox"
            :checked="isSelected(category.id, selectedCategoryIds)"
            @change="emit('toggle-category', category.id)"
          />
          <span class="category-name">{{ category.name }}</span>
          <span class="badge text-bg-light border">{{ category.count }}</span>
        </label>
      </div>

      <p v-else class="small text-secondary p-4 mb-0">Add a category when you need one.</p>
    </div>

  </div>
</template>

<style scoped>
.category-sidebar {
  flex: 0 0 280px;
  height: calc(100svh - 72px);
  position: sticky;
  top: 72px;
  z-index: 1000;
  flex-direction: column;
}

.category-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.category-list {
  display: grid;
  gap: 8px;
}

.category-row {
  align-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 10px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 44px;
  padding: 8px 10px;
}

.category-sidebar {
  background: #fff9ec;
}

.category-row:hover,
.category-row.is-selected {
  background: #f5ead0;
  border-color: #d9c59c;
}

.category-name {
  color: #2a432a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu {
  background: #fff9ec;
  display: flex;
  flex-direction: column;
  inset: 0;
  position: fixed;
  z-index: 1100;
}

.mobile-menu-header {
  align-items: center;
  background: #fff9ec;
  display: flex;
  flex: 0 0 auto;
  justify-content: space-between;
  padding: 14px 16px;
}

.mobile-menu-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.icon-button {
  align-items: center;
  color: #2a432a;
  display: inline-flex;
  height: 40px;
  justify-content: center;
  padding: 0;
  text-decoration: none;
  width: 40px;
}

.btn .material-icons {
  font-size: 20px;
}
</style>
