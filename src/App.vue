<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CategoryModal from './components/CategoryModal.vue'
import CookingMode from './components/CookingMode.vue'
import FloatingActionMenu from './components/FloatingActionMenu.vue'
import RecipeDetailView from './components/RecipeDetailView.vue'
import RecipeEditorModal from './components/RecipeEditorModal.vue'
import RecipeList from './components/RecipeList.vue'
import TheSidebar from './components/TheSidebar.vue'
import TheTopBar from './components/TheTopBar.vue'
import { formatDateTime } from './lib/dates'
import { createId } from './lib/ids'
import { getCategories, getRecipes, saveCategory, saveRecipe } from './lib/storage'
import { DEFAULT_CATEGORY_ID, type Category, type CategoryOption, type Recipe, type RecipeCardView, type RecipeFormPayload, type SortKey } from './types'

const recipes = ref<Recipe[]>([])
const userCategories = ref<Category[]>([])
const selectedCategoryIds = ref<string[]>([])
const sortKey = ref<SortKey>('name')
const ascending = ref(true)
const loading = ref(true)
const mobileMenuOpen = ref(false)
const categoryModalOpen = ref(false)
const recipeModalOpen = ref(false)
const editingRecipe = ref<Recipe | null>(null)
const selectedRecipeId = ref<string | null>(null)
const cookingRecipe = ref<RecipeCardView | null>(null)
const storageError = ref('')

const sortedUserCategories = computed(() =>
  [...userCategories.value].sort((firstCategory, secondCategory) => firstCategory.name.localeCompare(secondCategory.name)),
)

const editorCategories = computed<CategoryOption[]>(() => [
  {
    id: DEFAULT_CATEGORY_ID,
    name: 'Default',
    createdAt: '',
    count: recipeCounts.value.get(DEFAULT_CATEGORY_ID) ?? 0,
  },
  ...sortedUserCategories.value.map((category) => ({
    ...category,
    count: recipeCounts.value.get(category.id) ?? 0,
  })),
])

const navCategories = computed<CategoryOption[]>(() => {
  const categories = recipes.value.length > 0 ? [editorCategories.value[0]] : []
  categories.push(...editorCategories.value.slice(1))
  return categories
})

const categoryNameById = computed(() => {
  const categoryLookup = new Map<string, string>()
  categoryLookup.set(DEFAULT_CATEGORY_ID, 'Default')

  for (const category of userCategories.value) {
    categoryLookup.set(category.id, category.name)
  }

  return categoryLookup
})

const recipeCounts = computed(() => {
  const counts = new Map<string, number>()
  counts.set(DEFAULT_CATEGORY_ID, 0)

  for (const category of userCategories.value) {
    counts.set(category.id, 0)
  }

  for (const recipe of recipes.value) {
    const categoryIds = recipe.categoryIds.length > 0 ? recipe.categoryIds : [DEFAULT_CATEGORY_ID]

    for (const categoryId of categoryIds) {
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1)
    }
  }

  return counts
})

const hasSelectedCategories = computed(() => selectedCategoryIds.value.length > 0)

const filteredRecipes = computed(() => {
  if (!hasSelectedCategories.value) {
    return recipes.value
  }

  const selectedCategories = new Set(selectedCategoryIds.value)

  return recipes.value.filter((recipe) => {
    const categoryIds = recipe.categoryIds.length > 0 ? recipe.categoryIds : [DEFAULT_CATEGORY_ID]
    return categoryIds.some((categoryId) => selectedCategories.has(categoryId))
  })
})

const visibleRecipes = computed<RecipeCardView[]>(() => {
  const sortedRecipes = [...filteredRecipes.value].sort(compareRecipes)

  if (!ascending.value) {
    sortedRecipes.reverse()
  }

  return sortedRecipes.map(toRecipeCardView)
})

const selectedRecipeView = computed<RecipeCardView | null>(() => {
  if (!selectedRecipeId.value) {
    return null
  }

  const recipe = recipes.value.find((currentRecipe) => currentRecipe.id === selectedRecipeId.value)
  return recipe ? toRecipeCardView(recipe) : null
})

onMounted(async () => {
  try {
    const [storedCategories, storedRecipes] = await Promise.all([getCategories(), getRecipes()])
    userCategories.value = storedCategories
    recipes.value = storedRecipes
  } catch (error) {
    storageError.value = error instanceof Error ? error.message : 'Unable to load local recipes.'
  } finally {
    loading.value = false
  }
})

function compareRecipes(firstRecipe: Recipe, secondRecipe: Recipe): number {
  if (sortKey.value === 'created') {
    return firstRecipe.createdAt.localeCompare(secondRecipe.createdAt)
  }

  if (sortKey.value === 'updated') {
    return firstRecipe.updatedAt.localeCompare(secondRecipe.updatedAt)
  }

  if (sortKey.value === 'category') {
    return getCategorySortLabel(firstRecipe).localeCompare(getCategorySortLabel(secondRecipe))
  }

  return firstRecipe.name.localeCompare(secondRecipe.name)
}

function getCategorySortLabel(recipe: Recipe): string {
  return getCategoryNames(recipe).join(', ')
}

function getCategoryNames(recipe: Recipe): string[] {
  const categoryIds = recipe.categoryIds.length > 0 ? recipe.categoryIds : [DEFAULT_CATEGORY_ID]
  return categoryIds.map((categoryId) => categoryNameById.value.get(categoryId) ?? 'Unknown')
}

function toRecipeCardView(recipe: Recipe): RecipeCardView {
  return {
    ...recipe,
    categoryNames: getCategoryNames(recipe),
    createdLabel: formatDateTime(recipe.createdAt),
    updatedLabel: formatDateTime(recipe.updatedAt),
  }
}

function openNewRecipeModal(): void {
  editingRecipe.value = null
  recipeModalOpen.value = true
}

function openRecipeDetail(recipe: Recipe): void {
  selectedRecipeId.value = recipe.id
}

function openEditRecipeModal(recipe: Recipe): void {
  editingRecipe.value = recipe
  recipeModalOpen.value = true
}

function closeRecipeModal(): void {
  recipeModalOpen.value = false
  editingRecipe.value = null
}

function openCookingMode(recipe: RecipeCardView): void {
  cookingRecipe.value = recipe
}

function closeCookingMode(): void {
  cookingRecipe.value = null
}

function openCategoryModal(): void {
  categoryModalOpen.value = true
  mobileMenuOpen.value = false
}

function closeCategoryModal(): void {
  categoryModalOpen.value = false
}

function toggleCategoryFilter(categoryId: string): void {
  if (selectedCategoryIds.value.includes(categoryId)) {
    selectedCategoryIds.value = selectedCategoryIds.value.filter((selectedCategoryId) => selectedCategoryId !== categoryId)
    return
  }

  selectedCategoryIds.value = [...selectedCategoryIds.value, categoryId]
}

async function handleSaveCategory(name: string): Promise<void> {
  const normalizedName = name.trim().toLocaleLowerCase()
  const existingNames = new Set(editorCategories.value.map((category) => category.name.trim().toLocaleLowerCase()))

  if (existingNames.has(normalizedName)) {
    return
  }

  const now = new Date().toISOString()
  const category: Category = {
    id: createId('category'),
    name: name.trim(),
    createdAt: now,
  }

  try {
    await saveCategory(category)
    userCategories.value = [...userCategories.value, category]
    categoryModalOpen.value = false
  } catch (error) {
    storageError.value = error instanceof Error ? error.message : 'Unable to save category.'
  }
}

async function handleSaveRecipe(payload: RecipeFormPayload): Promise<void> {
  const now = new Date().toISOString()
  const existingRecipe = payload.id ? recipes.value.find((recipe) => recipe.id === payload.id) : undefined
  const recipe: Recipe = {
    id: existingRecipe?.id ?? createId('recipe'),
    name: payload.name,
    description: payload.description,
    categoryIds: payload.categoryIds.length > 0 ? payload.categoryIds : [DEFAULT_CATEGORY_ID],
    images: payload.images,
    servings: payload.servings,
    prepTimeMinutes: payload.prepTimeMinutes,
    cookTimeMinutes: payload.cookTimeMinutes,
    ingredients: payload.ingredients,
    sections: payload.sections,
    notes: payload.notes,
    storageNotes: payload.storageNotes,
    createdAt: existingRecipe?.createdAt ?? now,
    updatedAt: now,
  }

  try {
    await saveRecipe(recipe)
    recipes.value = existingRecipe
      ? recipes.value.map((currentRecipe) => (currentRecipe.id === recipe.id ? recipe : currentRecipe))
      : [...recipes.value, recipe]
    selectedRecipeId.value = recipe.id
    closeRecipeModal()
  } catch (error) {
    storageError.value = error instanceof Error ? error.message : 'Unable to save recipe.'
  }
}
</script>

<template>
  <div class="app-shell">
    <TheTopBar @toggle-menu="mobileMenuOpen = true" />

    <div class="app-body">
      <TheSidebar
        :categories="navCategories"
        :mobile-open="mobileMenuOpen"
        :selected-category-ids="selectedCategoryIds"
        @close-menu="mobileMenuOpen = false"
        @toggle-category="toggleCategoryFilter"
      />

      <main class="content-area">
        <div v-if="storageError.length > 0" class="alert alert-warning d-flex align-items-center gap-2" role="alert">
          <span class="material-icons" aria-hidden="true">warning</span>
          <span>{{ storageError }}</span>
        </div>

        <div v-if="loading" class="loading-panel bg-white border">
          <div class="spinner-border text-success" role="status">
            <span class="visually-hidden">Loading</span>
          </div>
        </div>

        <RecipeDetailView
          v-else-if="selectedRecipeView"
          :recipe="selectedRecipeView"
          @back="selectedRecipeId = null"
          @edit-recipe="openEditRecipeModal"
          @start-cooking="openCookingMode"
        />

        <template v-else>
          <div class="content-header">
            <div>
              <h2 class="h4 mb-1">Recipes</h2>
              <p class="text-secondary mb-0">{{ visibleRecipes.length }} shown</p>
            </div>

            <div class="sort-controls">
              <label class="sort-icon" for="sort-by" title="Sort recipes">
                <span class="material-icons" aria-hidden="true">sort</span>
                <span class="visually-hidden">Sort by</span>
              </label>
              <select id="sort-by" v-model="sortKey" class="form-select">
                <option value="name">Name</option>
                <option value="category">Category</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
              </select>

              <label class="form-check sort-direction mb-0">
                <input v-model="ascending" class="form-check-input" type="checkbox" />
                <span class="form-check-label">asc</span>
              </label>
            </div>
          </div>

          <RecipeList
            :recipes="visibleRecipes"
            :has-recipes="recipes.length > 0"
            :is-filtered="hasSelectedCategories"
            @add-recipe="openNewRecipeModal"
            @view-recipe="openRecipeDetail"
            @edit-recipe="openEditRecipeModal"
          />
        </template>
      </main>
    </div>

    <RecipeEditorModal
      :categories="editorCategories"
      :recipe="editingRecipe"
      :show="recipeModalOpen"
      @close="closeRecipeModal"
      @save-recipe="handleSaveRecipe"
    />

    <CategoryModal
      :categories="editorCategories"
      :show="categoryModalOpen"
      @close="closeCategoryModal"
      @save-category="handleSaveCategory"
    />

    <CookingMode :recipe="cookingRecipe" :show="cookingRecipe !== null" @close="closeCookingMode" />
    <FloatingActionMenu
      v-if="!recipeModalOpen && !categoryModalOpen && cookingRecipe === null && !mobileMenuOpen"
      @add-category="openCategoryModal"
      @add-recipe="openNewRecipeModal"
    />
  </div>
</template>

<style scoped>
.app-shell {
  background: #faf2dd;
  color: #2a432a;
  min-height: 100svh;
}

.app-body {
  align-items: flex-start;
  display: flex;
}

.content-area {
  flex: 1 1 auto;
  min-width: 0;
  padding: 18px 14px 32px;
}

.content-header {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 18px;
}

.sort-controls {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: auto minmax(136px, 1fr) auto;
  max-width: 100%;
}

.sort-icon {
  align-items: center;
  color: #486034;
  display: inline-flex;
  height: 38px;
  justify-content: center;
  margin: 0;
  width: 38px;
}

.sort-icon .material-icons {
  font-size: 22px;
}

.sort-direction {
  align-items: center;
  display: flex;
  gap: 7px;
  min-height: 38px;
}

.loading-panel {
  align-items: center;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  min-height: 320px;
}

@media (min-width: 768px) {
  .content-area {
    padding: 24px;
  }

  .content-header {
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
  }
}

@media (min-width: 1200px) {
  .content-area {
    padding: 28px 32px 40px;
  }
}
</style>
