<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DEFAULT_CATEGORY_ID, type CategoryOption } from '../types'

const props = defineProps<{
  categories: CategoryOption[]
  show: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save-category', name: string): void
}>()

const categoryName = ref('')
const touched = ref(false)

const normalizedNames = computed(() => {
  const names = props.categories.map((category) => category.name.trim().toLocaleLowerCase())
  names.push(DEFAULT_CATEGORY_ID)
  return new Set(names)
})

const nameError = computed(() => {
  const name = categoryName.value.trim()

  if (!touched.value && name.length === 0) {
    return ''
  }

  if (name.length === 0) {
    return 'Category name is required.'
  }

  if (normalizedNames.value.has(name.toLocaleLowerCase())) {
    return 'Category names must be unique.'
  }

  return ''
})

const canSave = computed(() => categoryName.value.trim().length > 0 && nameError.value.length === 0)

watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      categoryName.value = ''
      touched.value = false
    }
  },
)

function submitCategory(): void {
  touched.value = true

  if (!canSave.value) {
    return
  }

  emit('save-category', categoryName.value.trim())
}
</script>

<template>
  <div v-if="show" class="modal-backdrop fade show"></div>
  <div v-if="show" class="modal hungry-codex-modal show" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
    <div class="modal-dialog modal-dialog-centered">
      <form class="modal-content" @submit.prevent="submitCategory">
        <div class="modal-header">
          <h2 id="category-modal-title" class="modal-title h5">Add Category</h2>
          <button class="btn-close" type="button" aria-label="Close" @click="emit('close')"></button>
        </div>

        <div class="modal-body">
          <label class="form-label" for="category-name">Category name</label>
          <input
            id="category-name"
            v-model.trim="categoryName"
            class="form-control"
            :class="{ 'is-invalid': nameError.length > 0 }"
            type="text"
            autocomplete="off"
            required
            @blur="touched = true"
          />
          <div v-if="nameError.length > 0" class="invalid-feedback">{{ nameError }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline-secondary" type="button" @click="emit('close')">Cancel</button>
          <button class="btn btn-success" type="submit" :disabled="!canSave">Save Category</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.hungry-codex-modal {
  display: block;
}

.btn-success {
  --bs-btn-bg: var(--hc-accent);
  --bs-btn-border-color: var(--hc-accent);
  --bs-btn-hover-bg: var(--hc-accent-dark);
  --bs-btn-hover-border-color: var(--hc-accent-dark);
  --bs-btn-active-bg: var(--hc-accent-dark);
  --bs-btn-active-border-color: var(--hc-accent-dark);
}
</style>
