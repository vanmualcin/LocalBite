<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (event: 'add-category'): void
  (event: 'add-recipe'): void
}>()

const menuOpen = ref(false)

function runAction(action: 'add-category' | 'add-recipe'): void {
  menuOpen.value = false

  if (action === 'add-category') {
    emit('add-category')
    return
  }

  emit('add-recipe')
}
</script>

<template>
  <div class="floating-action-menu" @keydown.esc="menuOpen = false">
    <div v-if="menuOpen" class="fab-menu" role="menu" aria-label="Create">
      <button class="btn fab-menu-item" type="button" role="menuitem" @click="runAction('add-category')">
        <span class="material-icons" aria-hidden="true">create_new_folder</span>
        <span>Add Category</span>
      </button>
      <button class="btn fab-menu-item" type="button" role="menuitem" @click="runAction('add-recipe')">
        <span class="material-icons" aria-hidden="true">note_add</span>
        <span>Add Recipe</span>
      </button>
    </div>

    <button
      class="btn fab-trigger"
      type="button"
      aria-label="Create"
      :aria-expanded="menuOpen"
      aria-haspopup="menu"
      @click="menuOpen = !menuOpen"
    >
      <span class="material-icons" aria-hidden="true">add</span>
    </button>
  </div>
</template>

<style scoped>
.floating-action-menu {
  bottom: max(20px, env(safe-area-inset-bottom));
  display: grid;
  gap: 12px;
  justify-items: end;
  position: fixed;
  right: max(18px, env(safe-area-inset-right));
  z-index: 1035;
}

.fab-trigger {
  border-radius: 999px !important;
  height: 62px;
  justify-content: center;
  padding: 0;
  width: 62px;
}

.fab-trigger .material-icons {
  font-size: 30px;
}

.fab-menu {
  backdrop-filter: saturate(170%) blur(16px);
  -webkit-backdrop-filter: saturate(170%) blur(16px);
  background: color-mix(in srgb, var(--hc-surface) 92%, transparent);
  border: 1px solid var(--hc-border);
  border-radius: 8px;
  box-shadow: 0 8px 22px var(--hc-shadow);
  display: grid;
  gap: 8px;
  min-width: 188px;
  padding: 10px;
}

.fab-menu-item {
  display: grid;
  gap: 10px;
  grid-template-columns: auto minmax(0, 1fr);
  justify-content: start;
  text-align: left;
}

.fab-menu-item .material-icons {
  font-size: 20px;
}
</style>
