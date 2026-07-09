<script setup lang="ts">
import type { RecipeCardView, RecipeStep } from '../types'

const props = defineProps<{
  recipe: RecipeCardView
}>()

const emit = defineEmits<{
  (event: 'back'): void
  (event: 'edit-recipe', recipe: RecipeCardView): void
  (event: 'start-cooking', recipe: RecipeCardView): void
}>()

function imageAlt(): string {
  return `${props.recipe.name} image`
}

function metadataItems(): string[] {
  const items = [...props.recipe.categoryNames]

  if (props.recipe.prepTimeMinutes) {
    items.push(`Prep ${props.recipe.prepTimeMinutes} min`)
  }

  if (props.recipe.cookTimeMinutes) {
    items.push(`Cook ${props.recipe.cookTimeMinutes} min`)
  }

  if (props.recipe.servings) {
    items.push(`${props.recipe.servings} servings`)
  }

  return items
}

function timerLabel(step: RecipeStep): string {
  if (!step.timerSeconds) {
    return ''
  }

  const safeSeconds = Math.max(0, Math.round(step.timerSeconds))
  const days = Math.floor(safeSeconds / 86400)
  const hours = Math.floor((safeSeconds % 86400) / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  const parts = [
    durationPart(days, 'day'),
    durationPart(hours, 'hour'),
    durationPart(minutes, 'minute'),
    durationPart(seconds, 'second'),
  ].filter((part) => part.length > 0)

  return parts.length > 0 ? parts.join(' ') : '0 seconds'
}

function durationPart(value: number, label: string): string {
  if (value === 0) {
    return ''
  }

  return `${value} ${label}${value === 1 ? '' : 's'}`
}
</script>

<template>
  <article class="recipe-detail">
    <button class="btn btn-outline-secondary d-inline-flex align-items-center gap-2 back-button" type="button" @click="emit('back')">
      <span class="material-icons" aria-hidden="true">arrow_back</span>
      <span>Recipes</span>
    </button>

    <section class="recipe-hero bg-white border">
      <div class="recipe-hero-media">
        <img v-if="recipe.images[0]" :src="recipe.images[0].dataUrl" :alt="imageAlt()" />
        <div v-else class="recipe-hero-placeholder" aria-hidden="true">
          <span class="material-icons">menu_book</span>
        </div>
      </div>

      <div class="recipe-hero-copy">
        <p v-if="metadataItems().length > 0" class="metadata-line mb-2">{{ metadataItems().join(' / ') }}</p>
        <h2 class="recipe-title">{{ recipe.name }}</h2>
        <p v-if="recipe.description" class="recipe-description text-secondary">{{ recipe.description }}</p>

        <div class="action-row">
          <button class="btn btn-success d-inline-flex align-items-center gap-2" type="button" @click="emit('start-cooking', recipe)">
            <span class="material-icons" aria-hidden="true">restaurant</span>
            <span>Start Cooking</span>
          </button>
          <button class="btn btn-outline-secondary d-inline-flex align-items-center gap-2" type="button" @click="emit('edit-recipe', recipe)">
            <span class="material-icons" aria-hidden="true">edit</span>
            <span>Edit</span>
          </button>
        </div>
      </div>
    </section>

    <div class="detail-layout">
      <section class="detail-panel bg-white border">
        <h3>Ingredients</h3>
        <ul v-if="recipe.ingredients.length > 0" class="ingredient-list">
          <li v-for="ingredient in recipe.ingredients" :key="ingredient.id">{{ ingredient.text }}</li>
        </ul>
        <p v-else class="text-secondary mb-0">No ingredients added yet.</p>
      </section>

      <section class="detail-panel bg-white border instruction-panel">
        <h3>Instructions</h3>
        <div v-if="recipe.sections.length > 0" class="instruction-stack">
          <section v-for="section in recipe.sections" :key="section.id" class="instruction-section">
            <h4>{{ section.title }}</h4>
            <ol>
              <li v-for="step in section.steps" :key="step.id">
                <span>{{ step.text }}</span>
                <span v-if="timerLabel(step)" class="timer-chip">{{ timerLabel(step) }}</span>
              </li>
            </ol>
          </section>
        </div>
        <p v-else class="text-secondary mb-0">No instruction steps added yet.</p>
      </section>
    </div>

    <section v-if="recipe.storageNotes || recipe.notes" class="notes-grid">
      <div v-if="recipe.storageNotes" class="detail-panel bg-white border">
        <h3>Storage</h3>
        <p class="mb-0">{{ recipe.storageNotes }}</p>
      </div>

      <div v-if="recipe.notes" class="detail-panel bg-white border">
        <h3>Notes</h3>
        <p class="mb-0">{{ recipe.notes }}</p>
      </div>
    </section>
  </article>
</template>

<style scoped>
.recipe-detail {
  display: grid;
  gap: 16px;
}

.back-button {
  justify-self: start;
}

.recipe-hero {
  border-radius: 8px;
  display: grid;
  overflow: hidden;
}

.recipe-hero-media {
  background: var(--hc-section);
  min-height: 220px;
}

.recipe-hero-media img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.recipe-hero-placeholder {
  align-items: center;
  color: var(--hc-text-soft);
  display: flex;
  height: 100%;
  justify-content: center;
  min-height: 220px;
}

.recipe-hero-placeholder .material-icons {
  font-size: 54px;
}

.recipe-hero-copy {
  align-content: center;
  display: grid;
  gap: 12px;
  padding: 20px;
}

.metadata-line {
  color: var(--hc-warm);
  font-size: 0.9rem;
  font-weight: 750;
}

.recipe-title {
  color: var(--hc-text);
  font-size: 2rem;
  font-weight: 850;
  line-height: 1.05;
  margin: 0;
}

.recipe-description {
  font-size: 1rem;
  margin: 0;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.detail-layout,
.notes-grid {
  display: grid;
  gap: 16px;
}

.detail-panel {
  border-radius: 8px;
  padding: 18px;
}

.detail-panel h3 {
  color: var(--hc-text);
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0 0 12px;
}

.ingredient-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 1.2rem;
}

.instruction-stack {
  display: grid;
  gap: 18px;
}

.instruction-section h4 {
  color: var(--hc-text-soft);
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 10px;
}

.instruction-section ol {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 1.35rem;
}

.instruction-section li {
  padding-left: 4px;
}

.timer-chip {
  background: var(--hc-chip);
  border: 1px solid var(--hc-border-strong);
  border-radius: 999px;
  color: var(--hc-warm);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 800;
  margin-left: 8px;
  padding: 2px 8px;
  white-space: nowrap;
}

.btn .material-icons {
  font-size: 18px;
}

@media (min-width: 768px) {
  .recipe-hero {
    grid-template-columns: minmax(240px, 34%) minmax(0, 1fr);
  }

  .recipe-hero-media,
  .recipe-hero-placeholder {
    min-height: 280px;
  }

  .recipe-title {
    font-size: 2.4rem;
  }

  .detail-layout {
    grid-template-columns: minmax(240px, 32%) minmax(0, 1fr);
  }

  .notes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
