<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { createId } from '../lib/ids'
import { resizeImages } from '../lib/image'
import { DEFAULT_CATEGORY_ID, type CategoryOption, type Ingredient, type Recipe, type RecipeFormPayload, type RecipeImage, type RecipeSection } from '../types'

interface IngredientFormRow {
  id: string
  text: string
}

interface StepFormRow {
  id: string
  text: string
  timerEnabled: boolean
  timerSeconds?: number
  timerMinutes: string
}

interface SectionFormState {
  id: string
  title: string
  steps: StepFormRow[]
}

interface RecipeFormState {
  categoryIds: string[]
  name: string
  description: string
  servings: string
  prepTimeMinutes: string
  cookTimeMinutes: string
  ingredients: IngredientFormRow[]
  hasPreparationSteps: boolean
  preparationSection: SectionFormState
  cookingSection: SectionFormState
  notes: string
  storageNotes: string
  images: RecipeImage[]
}

const PREPARATION_TITLE = 'Preparation'
const COOKING_TITLE = 'Cooking'

const props = defineProps<{
  categories: CategoryOption[]
  recipe: Recipe | null
  show: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'save-recipe', payload: RecipeFormPayload): void
}>()

const form = reactive<RecipeFormState>(blankForm())
const categoryDropdownOpen = ref(false)
const detailsOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const imageError = ref('')
const imageProcessing = ref(false)

const modalTitle = computed(() => (props.recipe ? 'Edit Recipe' : 'Add Recipe'))
const saveLabel = computed(() => (props.recipe ? 'Save Changes' : 'Save Recipe'))
const selectedCategoryNames = computed(() =>
  props.categories
    .filter((category) => form.categoryIds.includes(category.id))
    .map((category) => category.name)
    .join(', '),
)
const primaryImage = computed(() => form.images[0] ?? null)
const hasRecipeName = computed(() => form.name.trim().length > 0)
const hasIngredient = computed(() => form.ingredients.some((ingredient) => ingredient.text.trim().length > 0))
const hasCookingStep = computed(() => form.cookingSection.steps.some((step) => step.text.trim().length > 0))
const missingRequirements = computed(() => {
  const missing: string[] = []

  if (!hasRecipeName.value) {
    missing.push('recipe name')
  }

  if (!hasIngredient.value) {
    missing.push('one ingredient')
  }

  if (!hasCookingStep.value) {
    missing.push('one cooking step')
  }

  return missing
})
const saveHint = computed(() => (missingRequirements.value.length > 0 ? `Add ${formatList(missingRequirements.value)} to save.` : ''))
const canSave = computed(() => missingRequirements.value.length === 0 && !imageProcessing.value)

watch(
  () => [props.show, props.recipe?.id],
  () => {
    if (props.show) {
      resetForm()
    }
  },
  { immediate: true },
)

function blankForm(): RecipeFormState {
  return {
    categoryIds: [DEFAULT_CATEGORY_ID],
    name: '',
    description: '',
    servings: '',
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    ingredients: [createIngredientRow()],
    hasPreparationSteps: false,
    preparationSection: createBlankSection(PREPARATION_TITLE),
    cookingSection: createBlankSection(COOKING_TITLE),
    notes: '',
    storageNotes: '',
    images: [],
  }
}

function createBlankSection(title: string): SectionFormState {
  return {
    id: createId('section'),
    title,
    steps: [createStepRow()],
  }
}

function createIngredientRow(ingredient?: Ingredient): IngredientFormRow {
  return {
    id: ingredient?.id ?? createId('ingredient'),
    text: ingredient?.text ?? '',
  }
}

function createStepRow(step?: { id: string; text: string; timerSeconds?: number }): StepFormRow {
  return {
    id: step?.id ?? createId('step'),
    text: step?.text ?? '',
    timerEnabled: Boolean(step?.timerSeconds),
    timerSeconds: step?.timerSeconds,
    timerMinutes: step?.timerSeconds ? secondsToTimerMinutes(step.timerSeconds) : '',
  }
}

function resetForm(): void {
  const nextForm = props.recipe ? recipeToForm(props.recipe) : blankForm()

  Object.assign(form, nextForm)
  categoryDropdownOpen.value = false
  detailsOpen.value = props.recipe ? recipeHasDetails(props.recipe) : false
  imageError.value = ''
  imageProcessing.value = false
}

function recipeToForm(recipe: Recipe): RecipeFormState {
  const ingredients = recipe.ingredients.length > 0 ? recipe.ingredients.map(createIngredientRow) : [createIngredientRow()]
  const preparationSection = createEditorSection(recipe.sections, PREPARATION_TITLE)
  const cookingSection = createEditorSection(recipe.sections, COOKING_TITLE)

  return {
    categoryIds: recipe.categoryIds.length > 0 ? [...recipe.categoryIds] : [DEFAULT_CATEGORY_ID],
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings?.toString() ?? '',
    prepTimeMinutes: recipe.prepTimeMinutes?.toString() ?? '',
    cookTimeMinutes: recipe.cookTimeMinutes?.toString() ?? '',
    ingredients,
    hasPreparationSteps: preparationSection.steps.some(stepHasContent),
    preparationSection,
    cookingSection,
    notes: recipe.notes,
    storageNotes: recipe.storageNotes,
    images: recipe.images.map((image) => ({ ...image })),
  }
}

function createEditorSection(sections: RecipeSection[], title: string): SectionFormState {
  const existingSection = sections.find((section) => section.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase())

  return existingSection ? sectionToForm(existingSection, title) : createBlankSection(title)
}

function sectionToForm(section: RecipeSection, title: string): SectionFormState {
  return {
    id: section.id,
    title,
    steps: section.steps.length > 0 ? section.steps.map(createStepRow) : [createStepRow()],
  }
}

function recipeHasDetails(recipe: Recipe): boolean {
  const hasCustomCategory = recipe.categoryIds.some((categoryId) => categoryId !== DEFAULT_CATEGORY_ID)
  return Boolean(
    recipe.description ||
      recipe.servings ||
      recipe.prepTimeMinutes ||
      recipe.cookTimeMinutes ||
      recipe.notes ||
      recipe.storageNotes ||
      hasCustomCategory,
  )
}

function stepHasContent(step: StepFormRow): boolean {
  return step.text.trim().length > 0 || (step.timerEnabled && step.timerMinutes.trim().length > 0)
}

function toggleCategory(categoryId: string): void {
  if (form.categoryIds.includes(categoryId)) {
    form.categoryIds = form.categoryIds.filter((selectedCategoryId) => selectedCategoryId !== categoryId)
  } else {
    form.categoryIds = [...form.categoryIds, categoryId]
  }
}

function openImagePicker(): void {
  fileInput.value?.click()
}

async function handleImageUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement

  if (!input.files || input.files.length === 0) {
    return
  }

  imageError.value = ''
  imageProcessing.value = true

  try {
    const resizedImages = await resizeImages(Array.from(input.files))

    if (resizedImages.length === 0) {
      imageError.value = 'Choose an image file.'
      return
    }

    form.images = resizedImages.slice(0, 1)
  } catch (error) {
    imageError.value = error instanceof Error ? error.message : 'Unable to process image.'
  } finally {
    imageProcessing.value = false
    input.value = ''
  }
}

function removeImage(): void {
  form.images = []
}

function addIngredient(): void {
  form.ingredients = [...form.ingredients, createIngredientRow()]
}

function removeIngredient(ingredientId: string): void {
  if (form.ingredients.length === 1) {
    form.ingredients[0].text = ''
    return
  }

  form.ingredients = form.ingredients.filter((ingredient) => ingredient.id !== ingredientId)
}

function togglePreparationSteps(event: Event): void {
  const input = event.target as HTMLInputElement
  form.hasPreparationSteps = input.checked

  if (form.hasPreparationSteps && form.preparationSection.steps.length === 0) {
    form.preparationSection.steps = [createStepRow()]
  }
}

function addStep(section: SectionFormState): void {
  section.steps = [...section.steps, createStepRow()]
}

function removeStep(section: SectionFormState, stepId: string): void {
  if (section.steps.length === 1) {
    section.steps[0].text = ''
    section.steps[0].timerEnabled = false
    section.steps[0].timerSeconds = undefined
    section.steps[0].timerMinutes = ''
    return
  }

  section.steps = section.steps.filter((step) => step.id !== stepId)
}

function normalizeTimerMinutes(step: StepFormRow): void {
  const minutes = parsePositiveInteger(step.timerMinutes)
  step.timerMinutes = minutes?.toString() ?? ''
}

function submitRecipe(): void {
  if (!canSave.value) {
    return
  }

  const sections = [
    form.hasPreparationSteps ? sectionToPayload(form.preparationSection) : null,
    sectionToPayload(form.cookingSection),
  ].filter((section): section is RecipeSection => section !== null)

  emit('save-recipe', {
    id: props.recipe?.id,
    name: form.name.trim(),
    description: form.description.trim(),
    categoryIds: form.categoryIds.length > 0 ? [...form.categoryIds] : [DEFAULT_CATEGORY_ID],
    images: form.images.map((image) => ({ ...image })),
    servings: parsePositiveInteger(form.servings),
    prepTimeMinutes: parsePositiveInteger(form.prepTimeMinutes),
    cookTimeMinutes: parsePositiveInteger(form.cookTimeMinutes),
    ingredients: form.ingredients
      .map((ingredient) => ({
        id: ingredient.id,
        text: ingredient.text.trim(),
      }))
      .filter((ingredient) => ingredient.text.length > 0),
    sections,
    notes: form.notes.trim(),
    storageNotes: form.storageNotes.trim(),
  })
}

function sectionToPayload(section: SectionFormState): RecipeSection | null {
  const steps = section.steps
    .map((step) => {
      const timerSeconds = parseTimerSeconds(step)
      return {
        id: step.id,
        text: step.text.trim(),
        ...(timerSeconds ? { timerSeconds } : {}),
      }
    })
    .filter((step) => step.text.length > 0)

  if (section.title.trim().length === 0 || steps.length === 0) {
    return null
  }

  return {
    id: section.id,
    title: section.title.trim(),
    steps,
  }
}

function parsePositiveInteger(value: string): number | undefined {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined
  }

  return Math.round(parsed)
}

function parseTimerSeconds(step: StepFormRow): number | undefined {
  if (!step.timerEnabled) {
    return undefined
  }

  const minutes = parsePositiveInteger(step.timerMinutes)

  if (step.timerSeconds && step.timerMinutes === secondsToTimerMinutes(step.timerSeconds)) {
    return step.timerSeconds
  }

  return minutes ? minutes * 60 : undefined
}

function secondsToTimerMinutes(seconds: number): string {
  return Math.max(1, Math.round(seconds / 60)).toString()
}

function formatList(items: string[]): string {
  if (items.length <= 1) {
    return items[0] ?? ''
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`
  }

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}
</script>

<template>
  <div v-if="show" class="modal-backdrop fade show"></div>
  <div v-if="show" class="modal hungry-codex-modal recipe-modal show" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="recipe-modal-title">
    <div class="modal-dialog modal-xl modal-dialog-scrollable recipe-modal-dialog">
      <form class="modal-content recipe-editor" novalidate @submit.prevent="submitRecipe">
        <div class="modal-header recipe-editor-header">
          <div class="header-copy">
            <h2 id="recipe-modal-title" class="modal-title">{{ modalTitle }}</h2>
            <p>Build the recipe once, then cook from clean steps.</p>
          </div>
          <button class="btn btn-light icon-only close-editor-button" type="button" aria-label="Close" @click="emit('close')">
            <span class="material-icons" aria-hidden="true">close</span>
          </button>
        </div>

        <div class="modal-body recipe-editor-body">
          <section class="editor-section recipe-section">
            <h3 class="section-heading">Recipe</h3>

            <div class="field-stack">
              <label class="form-label" for="recipe-name">Recipe name <span class="required-mark" aria-hidden="true">*</span></label>
              <input
                id="recipe-name"
                v-model="form.name"
                class="form-control recipe-name-input"
                type="text"
                autocomplete="off"
                required
                :aria-invalid="!hasRecipeName"
              />
            </div>

            <div class="photo-picker">
              <div class="section-title-row compact-title-row">
                <label class="form-label mb-0" for="recipe-images">Recipe photo</label>
                <span class="optional-label">Optional</span>
              </div>
              <input
                id="recipe-images"
                ref="fileInput"
                class="visually-hidden-file"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
              />

              <div v-if="!primaryImage" class="photo-empty-state">
                <button class="btn btn-outline-success d-inline-flex align-items-center gap-2" type="button" @click="openImagePicker">
                  <span class="material-icons" aria-hidden="true">add_photo_alternate</span>
                  <span>Add photo</span>
                </button>
                <p>Tap to choose or take a photo</p>
              </div>

              <div v-else class="photo-selected-state">
                <img :src="primaryImage.dataUrl" :alt="primaryImage.name" />
                <div class="photo-selected-copy">
                  <span>{{ primaryImage.name }}</span>
                  <div class="photo-actions">
                    <button class="btn btn-outline-secondary btn-sm" type="button" @click="openImagePicker">Change photo</button>
                    <button class="btn btn-link btn-sm remove-text-button" type="button" @click="removeImage">Remove</button>
                  </div>
                </div>
              </div>

              <p v-if="imageProcessing" class="small text-secondary mb-0">Resizing image before saving.</p>
              <p v-if="imageError.length > 0" class="small text-danger mb-0">{{ imageError }}</p>
            </div>
          </section>

          <section class="editor-section">
            <div class="section-title-row">
              <h3 class="section-heading mb-0">Ingredients <span class="required-mark" aria-hidden="true">*</span></h3>
            </div>

            <div class="editable-list">
              <div v-for="(ingredient, ingredientIndex) in form.ingredients" :key="ingredient.id" class="ingredient-row">
                <input
                  v-model="ingredient.text"
                  class="form-control"
                  type="text"
                  :aria-label="`Ingredient ${ingredientIndex + 1}`"
                  :aria-required="ingredientIndex === 0"
                  placeholder="2 cups flour"
                />
                <button class="btn btn-outline-secondary icon-only row-remove-button" type="button" aria-label="Remove ingredient" title="Remove ingredient" @click="removeIngredient(ingredient.id)">
                  <span class="material-icons" aria-hidden="true">remove</span>
                </button>
              </div>
            </div>

            <button class="btn btn-outline-success add-row-button" type="button" @click="addIngredient">
              <span class="material-icons" aria-hidden="true">add</span>
              <span>Add ingredient</span>
            </button>
          </section>

          <section class="editor-section steps-section">
            <h3 class="section-heading">Steps <span class="required-mark" aria-hidden="true">*</span></h3>

            <label class="form-check prep-toggle">
              <input class="form-check-input" type="checkbox" :checked="form.hasPreparationSteps" @change="togglePreparationSteps" />
              <span class="form-check-label">This recipe has preparation steps</span>
            </label>

            <section v-if="form.hasPreparationSteps" class="step-phase">
              <div class="phase-header">
                <h4>Preparation steps</h4>
              </div>

              <div class="step-list">
                <div v-for="(step, stepIndex) in form.preparationSection.steps" :key="step.id" class="step-row">
                  <div class="step-line">
                    <span class="step-number">{{ stepIndex + 1 }}</span>
                    <input
                      v-model="step.text"
                      class="form-control"
                      type="text"
                      :aria-label="`Preparation step ${stepIndex + 1}`"
                      placeholder="Describe this prep step"
                    />
                    <button class="btn btn-outline-secondary icon-only step-remove-button" type="button" aria-label="Remove preparation step" title="Remove step" @click="removeStep(form.preparationSection, step.id)">
                      <span class="material-icons" aria-hidden="true">remove</span>
                    </button>
                  </div>

                  <div class="step-options">
                    <label class="form-check timer-toggle">
                      <input v-model="step.timerEnabled" class="form-check-input" type="checkbox" />
                      <span class="form-check-label">Add timer</span>
                    </label>

                    <div v-if="step.timerEnabled" class="timer-minutes">
                      <span>Timer</span>
                      <input
                        v-model="step.timerMinutes"
                        class="form-control timer-minute-input"
                        type="number"
                        min="1"
                        inputmode="numeric"
                        aria-label="Timer minutes"
                        placeholder="10"
                        @blur="normalizeTimerMinutes(step)"
                      />
                      <span>minutes</span>
                    </div>
                  </div>
                </div>
              </div>

              <button class="btn btn-outline-success add-row-button" type="button" @click="addStep(form.preparationSection)">
                <span class="material-icons" aria-hidden="true">add</span>
                <span>Add preparation step</span>
              </button>
            </section>

            <section class="step-phase">
              <div class="phase-header">
                <h4>Cooking steps</h4>
              </div>

              <div class="step-list">
                <div v-for="(step, stepIndex) in form.cookingSection.steps" :key="step.id" class="step-row">
                  <div class="step-line">
                    <span class="step-number">{{ stepIndex + 1 }}</span>
                    <input
                      v-model="step.text"
                      class="form-control"
                      type="text"
                      :aria-label="`Cooking step ${stepIndex + 1}`"
                      :aria-required="stepIndex === 0"
                      placeholder="Describe this cooking step"
                    />
                    <button class="btn btn-outline-secondary icon-only step-remove-button" type="button" aria-label="Remove cooking step" title="Remove step" @click="removeStep(form.cookingSection, step.id)">
                      <span class="material-icons" aria-hidden="true">remove</span>
                    </button>
                  </div>

                  <div class="step-options">
                    <label class="form-check timer-toggle">
                      <input v-model="step.timerEnabled" class="form-check-input" type="checkbox" />
                      <span class="form-check-label">Add timer</span>
                    </label>

                    <div v-if="step.timerEnabled" class="timer-minutes">
                      <span>Timer</span>
                      <input
                        v-model="step.timerMinutes"
                        class="form-control timer-minute-input"
                        type="number"
                        min="1"
                        inputmode="numeric"
                        aria-label="Timer minutes"
                        placeholder="10"
                        @blur="normalizeTimerMinutes(step)"
                      />
                      <span>minutes</span>
                    </div>
                  </div>
                </div>
              </div>

              <button class="btn btn-outline-success add-row-button" type="button" @click="addStep(form.cookingSection)">
                <span class="material-icons" aria-hidden="true">add</span>
                <span>Add cooking step</span>
              </button>
            </section>
          </section>

          <section class="editor-section details-section">
            <button class="section-disclosure" type="button" :aria-expanded="detailsOpen" @click="detailsOpen = !detailsOpen">
              <span class="section-heading">Details</span>
              <span class="disclosure-meta">
                <span class="optional-label">Optional</span>
                <span class="material-icons" aria-hidden="true">{{ detailsOpen ? 'expand_less' : 'expand_more' }}</span>
              </span>
            </button>

            <div v-if="detailsOpen" class="details-content">
              <div class="details-grid">
                <div>
                  <label class="form-label" for="recipe-servings">Servings</label>
                  <input id="recipe-servings" v-model="form.servings" class="form-control" type="number" min="1" inputmode="numeric" />
                </div>
                <div>
                  <label class="form-label" for="recipe-prep-time">Prep time</label>
                  <div class="unit-input">
                    <input id="recipe-prep-time" v-model="form.prepTimeMinutes" class="form-control" type="number" min="1" inputmode="numeric" />
                    <span>minutes</span>
                  </div>
                </div>
                <div>
                  <label class="form-label" for="recipe-cook-time">Cook time</label>
                  <div class="unit-input">
                    <input id="recipe-cook-time" v-model="form.cookTimeMinutes" class="form-control" type="number" min="1" inputmode="numeric" />
                    <span>minutes</span>
                  </div>
                </div>
              </div>

              <div>
                <label class="form-label" for="recipe-categories">Category</label>
                <div id="recipe-categories" class="category-dropdown">
                  <button
                    class="form-select category-dropdown-button text-start"
                    type="button"
                    aria-haspopup="listbox"
                    :aria-expanded="categoryDropdownOpen"
                    @click="categoryDropdownOpen = !categoryDropdownOpen"
                  >
                    {{ selectedCategoryNames || 'Default' }}
                  </button>

                  <div v-if="categoryDropdownOpen" class="category-dropdown-menu bg-white shadow-sm" role="listbox" aria-multiselectable="true">
                    <label v-for="category in categories" :key="category.id" class="category-dropdown-item">
                      <input
                        class="form-check-input"
                        type="checkbox"
                        :checked="form.categoryIds.includes(category.id)"
                        @change="toggleCategory(category.id)"
                      />
                      <span>{{ category.name }}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label class="form-label" for="recipe-description">Description</label>
                <textarea id="recipe-description" v-model="form.description" class="form-control" rows="3"></textarea>
              </div>

              <div class="notes-grid">
                <div>
                  <label class="form-label" for="recipe-notes">General notes</label>
                  <textarea id="recipe-notes" v-model="form.notes" class="form-control" rows="3"></textarea>
                </div>
                <div>
                  <label class="form-label" for="recipe-storage-notes">Storage notes</label>
                  <textarea id="recipe-storage-notes" v-model="form.storageNotes" class="form-control" rows="3"></textarea>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="modal-footer recipe-editor-footer">
          <p v-if="saveHint" class="save-hint">{{ saveHint }}</p>
          <div class="footer-actions">
            <button class="btn btn-outline-secondary" type="button" @click="emit('close')">Cancel</button>
            <button class="btn btn-success save-button" type="submit" :disabled="!canSave">
              {{ saveLabel }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.hungry-codex-modal {
  display: block;
}

.recipe-modal-dialog {
  margin-bottom: 1rem;
  margin-top: 1rem;
}

.modal-content {
  border: 1px solid var(--hc-border);
  border-radius: 8px;
  overflow: hidden;
}

.recipe-editor {
  background: var(--hc-surface);
}

.recipe-editor-header {
  align-items: flex-start;
  background: var(--hc-surface);
  border-bottom: 1px solid var(--hc-border);
  gap: 14px;
  padding: 16px 18px;
}

.header-copy {
  display: grid;
  gap: 2px;
}

.header-copy h2 {
  color: var(--hc-text);
  font-size: 1.25rem;
  font-weight: 850;
  line-height: 1.15;
  margin: 0;
}

.header-copy p {
  color: var(--hc-muted);
  font-size: 0.92rem;
  line-height: 1.35;
  margin: 0;
}

.close-editor-button {
  height: 38px;
  margin-left: auto;
  width: 38px;
}

.recipe-editor-body {
  display: grid;
  gap: 16px;
  padding: 18px;
  padding-bottom: 112px;
}

.editor-section {
  background: var(--hc-section-soft);
  border-radius: 8px;
  display: grid;
  gap: 14px;
  padding: 16px;
}

.section-heading {
  color: var(--hc-text);
  font-size: 1.05rem;
  font-weight: 850;
  line-height: 1.2;
  margin: 0;
}

.required-mark {
  color: var(--hc-danger);
  font-weight: 850;
}

.optional-label {
  color: var(--hc-muted);
  font-size: 0.76rem;
  font-weight: 750;
  text-transform: uppercase;
}

.field-stack,
.photo-picker,
.details-content,
.step-phase {
  display: grid;
  gap: 10px;
}

.recipe-name-input {
  color: var(--hc-text);
  font-size: 1.2rem;
  font-weight: 750;
  min-height: 48px;
}

.section-title-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
}

.compact-title-row {
  justify-content: flex-start;
}

.visually-hidden-file {
  block-size: 1px;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  inline-size: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
}

.photo-empty-state {
  align-items: center;
  background: var(--hc-surface);
  border: 1px dashed var(--hc-border-strong);
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  min-height: 82px;
  padding: 14px;
}

.photo-empty-state p {
  color: var(--hc-muted);
  font-size: 0.9rem;
  margin: 0;
}

.photo-selected-state {
  align-items: center;
  background: var(--hc-surface);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  grid-template-columns: 88px minmax(0, 1fr);
  padding: 10px;
}

.photo-selected-state img {
  aspect-ratio: 1;
  border-radius: 8px;
  display: block;
  object-fit: cover;
  width: 88px;
}

.photo-selected-copy {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.photo-selected-copy > span {
  color: var(--hc-text-soft);
  font-size: 0.9rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-actions,
.footer-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.remove-text-button {
  box-shadow: none !important;
  color: var(--hc-warm) !important;
  padding-left: 8px;
  padding-right: 8px;
}

.editable-list,
.step-list,
.details-grid,
.notes-grid {
  display: grid;
  gap: 10px;
}

.ingredient-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
}

.add-row-button {
  align-items: center;
  display: inline-flex;
  gap: 6px;
  justify-self: start;
  min-height: 36px;
  padding: 0.35rem 0.7rem;
}

.prep-toggle,
.timer-toggle {
  align-items: center;
  display: inline-flex;
  gap: 8px;
  margin: 0;
}

.prep-toggle {
  color: var(--hc-text-soft);
  font-size: 0.92rem;
  font-weight: 750;
}

.step-phase {
  border-top: 1px solid var(--hc-border);
  padding-top: 14px;
}

.phase-header h4 {
  color: var(--hc-text-soft);
  font-size: 0.93rem;
  font-weight: 800;
  margin: 0;
}

.step-row {
  display: grid;
  gap: 8px;
}

.step-line {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.step-number {
  align-items: center;
  background: var(--hc-chip);
  border-radius: 999px;
  color: var(--hc-text-soft);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 850;
  height: 30px;
  justify-content: center;
  width: 30px;
}

.step-options {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding-left: 38px;
}

.timer-toggle {
  color: var(--hc-text-soft);
  font-size: 0.82rem;
  font-weight: 750;
}

.timer-minutes {
  align-items: center;
  color: var(--hc-text-soft);
  display: inline-grid;
  font-size: 0.84rem;
  font-weight: 750;
  gap: 7px;
  grid-template-columns: auto 72px auto;
}

.timer-minute-input {
  min-height: 36px;
  padding-left: 8px;
  padding-right: 8px;
  text-align: center;
}

.details-section {
  background: var(--hc-section-soft);
}

.section-disclosure {
  align-items: center;
  appearance: none;
  background: transparent;
  border: 0;
  color: inherit;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  margin: 0;
  padding: 0;
  text-align: left;
  width: 100%;
}

.section-disclosure:focus-visible {
  border-radius: 8px;
  box-shadow: 0 0 0 3px var(--hc-focus);
  outline: 0;
}

.disclosure-meta {
  align-items: center;
  color: var(--hc-muted);
  display: inline-flex;
  gap: 4px;
}

.details-grid {
  grid-template-columns: 1fr;
}

.unit-input {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
}

.unit-input span {
  color: var(--hc-muted);
  font-size: 0.88rem;
  font-weight: 650;
}

.category-dropdown {
  position: relative;
}

.category-dropdown-button {
  min-height: 38px;
}

.category-dropdown-menu {
  border: 1px solid var(--hc-border);
  border-radius: 8px;
  display: grid;
  gap: 2px;
  left: 0;
  max-height: 220px;
  overflow-y: auto;
  padding: 8px;
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 1080;
}

.category-dropdown-item {
  align-items: center;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  min-height: 38px;
  padding: 6px 8px;
}

.category-dropdown-item:hover {
  background: var(--hc-section);
}

.icon-only {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  height: 34px;
  justify-content: center;
  padding: 0;
  width: 34px;
}

.btn .material-icons {
  font-size: 18px;
}

.recipe-editor-footer {
  align-items: center;
  background: var(--hc-surface);
  border-top: 1px solid var(--hc-border);
  box-shadow: 0 -4px 14px var(--hc-shadow-soft);
  gap: 12px;
  justify-content: space-between;
  padding: 12px 18px;
}

.save-hint {
  color: var(--hc-warm);
  font-size: 0.86rem;
  font-weight: 700;
  margin: 0;
}

.footer-actions {
  justify-content: flex-end;
  margin-left: auto;
}

.save-button:disabled {
  background: color-mix(in srgb, var(--hc-muted) 18%, transparent) !important;
  border-color: var(--hc-border-strong) !important;
  box-shadow: none !important;
  color: color-mix(in srgb, var(--hc-text) 58%, transparent) !important;
  cursor: not-allowed;
  opacity: 1;
  text-shadow: none;
  transform: none;
}

@media (min-width: 640px) {
  .details-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .notes-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 768px) {
  .recipe-editor-body {
    gap: 18px;
    padding: 20px;
    padding-bottom: 118px;
  }

  .editor-section {
    padding: 18px;
  }

  .step-row {
    gap: 6px;
  }
}

@media (max-width: 575.98px) {
  .recipe-modal-dialog {
    height: 100svh;
    margin: 0;
    max-width: none;
    width: 100%;
  }

  .recipe-editor {
    border: 0;
    border-radius: 0;
    min-height: 100svh;
  }

  .recipe-editor-header {
    padding: 14px 14px 12px;
  }

  .header-copy h2 {
    font-size: 1.14rem;
  }

  .header-copy p {
    font-size: 0.85rem;
  }

  .recipe-editor-body {
    gap: 14px;
    padding: 14px;
    padding-bottom: calc(132px + env(safe-area-inset-bottom));
  }

  .editor-section {
    padding: 14px;
  }

  .photo-selected-state {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .photo-selected-state img {
    width: 72px;
  }

  .step-options {
    padding-left: 0;
  }

  .timer-minutes {
    grid-template-columns: auto minmax(64px, 78px) auto;
  }

  .recipe-editor-footer {
    align-items: stretch;
    padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
  }

  .save-hint {
    flex-basis: 100%;
  }

  .footer-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    margin-left: 0;
    width: 100%;
  }
}
</style>
