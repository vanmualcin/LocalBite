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
      class="recipe-card bg-white border"
    >
      <a
        class="recipe-open-link text-body text-decoration-none"
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
            <h2 class="h5 mb-1">{{ recipe.name }}</h2>
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
      {{ isFiltered ? 'Clear category filters to see everything.' : 'Create your first recipe and LocalBite will keep it on this device.' }}
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
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.recipe-card:hover,
.recipe-card:focus-within {
  border-color: rgba(72, 96, 52, 0.34) !important;
  box-shadow: 0 12px 26px rgba(42, 67, 42, 0.12);
  transform: translateY(-1px);
}

.recipe-open-link {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  min-height: 100%;
}

.recipe-open-link:focus-visible {
  outline: 3px solid rgba(72, 96, 52, 0.28);
  outline-offset: -3px;
}

.recipe-media {
  background: #f5ead0;
  min-height: 148px;
}

.recipe-media img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.recipe-media-placeholder {
  align-items: center;
  color: #486034;
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
  color: #486034;
  font-size: 0.95rem;
}

.details-preview {
  color: #8b4a23;
  font-size: 0.9rem;
  font-weight: 650;
}

.category-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.recipe-meta {
  border-top: 1px solid #e1d2b4;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  padding-top: 12px;
}

.recipe-meta dt {
  color: #6c757d;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.recipe-meta dd {
  color: #8b4a23;
  font-size: 0.875rem;
  margin: 0;
}

.btn-success {
  --bs-btn-bg: #486034;
  --bs-btn-border-color: #486034;
  --bs-btn-hover-bg: #3d522c;
  --bs-btn-hover-border-color: #3d522c;
  --bs-btn-active-bg: #324425;
  --bs-btn-active-border-color: #324425;
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
  color: #486034;
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
