<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryOption } from '../types'

interface ThemeOption {
  id: string
  name: string
  swatches: string[]
}

const props = defineProps<{
  categories: CategoryOption[]
  mobileOpen: boolean
  selectedCategoryIds: string[]
  selectedTheme: string
  themeOptions: ThemeOption[]
}>()

const emit = defineEmits<{
  (event: 'close-menu'): void
  (event: 'select-theme', themeId: string): void
  (event: 'toggle-category', categoryId: string): void
}>()

const selectedThemeOption = computed(() => props.themeOptions.find((theme) => theme.id === props.selectedTheme) ?? props.themeOptions[0])

function isSelected(categoryId: string, selectedCategoryIds: string[]): boolean {
  return selectedCategoryIds.includes(categoryId)
}

function handleThemeChange(event: Event): void {
  const select = event.target as HTMLSelectElement
  emit('select-theme', select.value)
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

    <div class="theme-settings border-top">
      <label class="theme-label" for="desktop-theme-select">Theme</label>
      <div class="theme-select-row">
        <select id="desktop-theme-select" class="form-select" :value="selectedTheme" @change="handleThemeChange">
          <option v-for="theme in themeOptions" :key="theme.id" :value="theme.id">{{ theme.name }}</option>
        </select>
        <div class="theme-swatches" aria-hidden="true">
          <span v-for="swatch in selectedThemeOption.swatches" :key="swatch" :style="{ backgroundColor: swatch }"></span>
        </div>
      </div>
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
      <div class="mobile-category-scroll">
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

      <div class="theme-settings mobile-theme-settings border-top">
        <label class="theme-label" for="mobile-theme-select">Theme</label>
        <div class="theme-select-row">
          <select id="mobile-theme-select" class="form-select" :value="selectedTheme" @change="handleThemeChange">
            <option v-for="theme in themeOptions" :key="theme.id" :value="theme.id">{{ theme.name }}</option>
          </select>
          <div class="theme-swatches" aria-hidden="true">
            <span v-for="swatch in selectedThemeOption.swatches" :key="swatch" :style="{ backgroundColor: swatch }"></span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.category-sidebar {
  flex: 0 0 280px;
  height: calc(100svh - var(--hc-topbar-total-height));
  position: sticky;
  top: var(--hc-topbar-total-height);
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
  background: var(--hc-surface);
}

.category-row:hover,
.category-row.is-selected {
  background: var(--hc-section);
  border-color: var(--hc-border-strong);
}

.category-name {
  color: var(--hc-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile-menu {
  background: var(--hc-surface);
  display: flex;
  flex-direction: column;
  inset: 0;
  position: fixed;
  z-index: 1100;
}

.mobile-menu-header {
  align-items: center;
  background: var(--hc-surface);
  display: flex;
  flex: 0 0 auto;
  justify-content: space-between;
  padding: calc(14px + var(--hc-safe-area-top)) 16px 14px;
}

.mobile-menu-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.mobile-category-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.theme-settings {
  display: grid;
  flex: 0 0 auto;
  gap: 8px;
  padding: 14px 16px 16px;
}

.theme-label {
  color: var(--hc-muted);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1;
  margin: 0;
  text-transform: uppercase;
}

.theme-select-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
}

.theme-swatches {
  background: var(--hc-control);
  border: 1px solid var(--hc-border-strong);
  border-radius: 999px;
  display: inline-grid;
  gap: 2px;
  grid-template-columns: repeat(4, 1fr);
  height: 30px;
  padding: 3px;
  width: 62px;
}

.theme-swatches span {
  border-radius: 999px;
}

.mobile-theme-settings {
  padding-bottom: calc(16px + var(--hc-safe-area-bottom));
}

.icon-button {
  align-items: center;
  color: var(--hc-text);
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
