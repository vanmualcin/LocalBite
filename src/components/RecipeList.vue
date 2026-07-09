<script setup lang="ts">
import type { RecipeCardView } from '../types'

defineProps<{
  recipes: RecipeCardView[]
  hasRecipes: boolean
  isFiltered: boolean
}>()

const emit = defineEmits<{
  (event: 'add-recipe'): void
  (event: 'view-recipe', recipe: RecipeCardView): void
  (event: 'edit-recipe', recipe: RecipeCardView): void
}>()

function imageAlt(recipe: RecipeCardView): string {
  return `${recipe.name} image`
}

function ingredientsPreview(recipe: RecipeCardView): string {
  const ingredients = recipe.ingredients.map((ingredient) => ingredient.text).filter(Boolean)
  return ingredients.length > 0 ? ingredients.slice(0, 3).join(' / ') : 'No ingredients added yet.'
}

function detailsPreview(recipe: RecipeCardView): string {
  const details = []

  if (recipe.prepTimeMinutes) {
    details.push(`Prep ${recipe.prepTimeMinutes} min`)
  }

  if (recipe.cookTimeMinutes) {
    details.push(`Cook ${recipe.cookTimeMinutes} min`)
  }

  if (recipe.servings) {
    details.push(`${recipe.servings} servings`)
  }

  return details.join(' / ')
}
</script>

<template>
  <section v-if="recipes.length > 0" class="recipe-grid" aria-label="Recipes">
    <article
      v-for="recipe in recipes"
      :key="recipe.id"
      class="recipe-card border"
    >
      <a
        class="recipe-open-link text-decoration-none"
        :href="`#recipe-${recipe.id}`"
        :aria-label="`Open ${recipe.name}`"
        @click.prevent="emit('view-recipe', recipe)"
      >
        <div class="recipe-media">
          <img v-if="recipe.images[0]" :src="recipe.images[0].dataUrl" :alt="imageAlt(recipe)" />
          <div v-else class="recipe-media-placeholder" aria-hidden="true">
            <span class="material-icons">menu_book</span>
          </div>
        </div>

        <div class="recipe-card-body">
          <div class="min-w-0">
            <h2 class="recipe-card-title h5 mb-1">{{ recipe.name }}</h2>
            <p class="recipe-description text-secondary mb-0">{{ recipe.description || detailsPreview(recipe) || 'Open to add details and cooking steps.' }}</p>
          </div>

          <div class="category-chip-row" aria-label="Categories">
            <span v-for="categoryName in recipe.categoryNames" :key="categoryName" class="badge rounded-pill text-bg-light border">
              {{ categoryName }}
            </span>
          </div>

          <p v-if="detailsPreview(recipe)" class="details-preview mb-0">{{ detailsPreview(recipe) }}</p>
          <p class="ingredients-preview mb-0">{{ ingredientsPreview(recipe) }}</p>

          <dl class="recipe-meta mb-0">
            <div>
              <dt>Created</dt>
              <dd>{{ recipe.createdLabel }}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{{ recipe.updatedLabel }}</dd>
            </div>
          </dl>
        </div>
      </a>

      <button class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 recipe-edit-button" type="button" @click="emit('edit-recipe', recipe)">
        <span class="material-icons" aria-hidden="true">edit</span>
        <span>Edit</span>
      </button>
    </article>
  </section>

  <section v-else class="empty-state bg-white border">
    <span class="material-icons empty-icon" aria-hidden="true">restaurant</span>
    <h2 class="h4">{{ hasRecipes ? 'No recipes match these categories' : 'No recipes yet' }}</h2>
    <p class="text-secondary mb-0">
      {{ isFiltered ? 'Clear category filters to see everything.' : 'Create your first recipe and Hungry Codex will keep it on this device.' }}
    </p>
    <button v-if="!hasRecipes" class="btn btn-success d-inline-flex align-items-center gap-2" type="button" @click="emit('add-recipe')">
      <span class="material-icons" aria-hidden="true">add</span>
      <span>Add Recipe</span>
    </button>
  </section>
</template>

<style scoped>
.recipe-grid {
  display: grid;
  gap: 14px;
}

.recipe-card {
  background: var(--hc-surface);
  border-radius: 8px;
  color: var(--hc-text);
  overflow: hidden;
  position: relative;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.recipe-card:hover,
.recipe-card:focus-within {
  border-color: var(--hc-border-strong) !important;
  box-shadow: 0 6px 18px var(--hc-shadow-soft);
  transform: translateY(-1px);
}

.recipe-open-link {
  color: var(--hc-text);
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  min-height: 100%;
}

.recipe-open-link:hover,
.recipe-open-link:focus {
  color: var(--hc-text);
}

.recipe-open-link:focus-visible {
  outline: 3px solid var(--hc-focus);
  outline-offset: -3px;
}

.recipe-card-title {
  color: var(--hc-text);
  font-weight: 750;
}

.recipe-media {
  background: var(--hc-section);
  min-height: 148px;
}

.recipe-media img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.recipe-media-placeholder {
  align-items: center;
  color: var(--hc-text-soft);
  display: flex;
  height: 100%;
  justify-content: center;
  min-height: 148px;
}

.recipe-media-placeholder .material-icons {
  font-size: 42px;
}

.recipe-card-body {
  display: grid;
  gap: 12px;
  padding: 16px 68px 16px 16px;
}

.recipe-edit-button {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 2;
}

.recipe-description,
.ingredients-preview,
.details-preview {
  display: -webkit-box;
  line-clamp: 2;
  overflow: hidden;
  -webkit-box-orient: vertical;
}

.ingredients-preview {
  color: var(--hc-text-soft);
  font-size: 0.95rem;
}

.details-preview {
  color: var(--hc-warm);
  font-size: 0.9rem;
  font-weight: 650;
}

.category-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recipe-meta {
  border-top: 1px solid var(--hc-border);
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding-top: 12px;
}

.recipe-meta dt {
  color: var(--hc-muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.recipe-meta dd {
  color: var(--hc-warm);
  font-size: 0.875rem;
  margin: 0;
}

.btn-success {
  --bs-btn-bg: var(--hc-accent);
  --bs-btn-border-color: var(--hc-accent);
  --bs-btn-hover-bg: var(--hc-accent-dark);
  --bs-btn-hover-border-color: var(--hc-accent-dark);
  --bs-btn-active-bg: var(--hc-accent-dark);
  --bs-btn-active-border-color: var(--hc-accent-dark);
}

.btn .material-icons {
  font-size: 18px;
}

.empty-state {
  align-items: center;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  justify-content: center;
  min-height: 360px;
  padding: 32px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--hc-text-soft);
  font-size: 44px;
}

.min-w-0 {
  min-width: 0;
}

@media (max-width: 575.98px) {
  .recipe-open-link {
    grid-template-columns: 1fr;
  }

  .recipe-media,
  .recipe-media-placeholder {
    min-height: 190px;
  }

  .recipe-card-body {
    padding-right: 16px;
    padding-top: 58px;
  }

  .recipe-meta {
    grid-template-columns: 1fr;
  }
}
</style>
