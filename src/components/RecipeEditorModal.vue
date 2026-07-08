<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { createId } from '../lib/ids'
import { resizeImages } from '../lib/image'
import { DEFAULT_CATEGORY_ID, type CategoryOption, type Ingredient, type Recipe, type RecipeFormPayload, type RecipeImage, type RecipeSection } from '../types'

interface IngredientFormRow {
  id: string
  text: string
}

interface TimerParts {
  days: string
  hours: string
  minutes: string
  seconds: string
}

interface StepFormRow {
  id: string
  text: string
  timerEnabled: boolean
  timerParts: TimerParts
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
  sections: SectionFormState[]
  notes: string
  storageNotes: string
  images: RecipeImage[]
}

const DEFAULT_SECTION_TITLES = ['Preparation', 'Cooking']

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
const canSave = computed(() => form.name.trim().length > 0 && !imageProcessing.value)

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
    sections: createDefaultSections(),
    notes: '',
    storageNotes: '',
    images: [],
  }
}

function createDefaultSections(): SectionFormState[] {
  return DEFAULT_SECTION_TITLES.map((title) => ({
    id: createId('section'),
    title,
    steps: [createStepRow()],
  }))
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
    timerParts: step?.timerSeconds ? splitTimerParts(step.timerSeconds) : createTimerParts(),
  }
}

function resetForm(): void {
  const nextForm = props.recipe ? recipeToForm(props.recipe) : blankForm()

  Object.assign(form, nextForm)
  categoryDropdownOpen.value = false
  imageError.value = ''
  imageProcessing.value = false
}

function recipeToForm(recipe: Recipe): RecipeFormState {
  const ingredients = recipe.ingredients.length > 0 ? recipe.ingredients.map(createIngredientRow) : [createIngredientRow()]
  const sections = createEditorSections(recipe.sections)

  return {
    categoryIds: recipe.categoryIds.length > 0 ? [...recipe.categoryIds] : [DEFAULT_CATEGORY_ID],
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings?.toString() ?? '',
    prepTimeMinutes: recipe.prepTimeMinutes?.toString() ?? '',
    cookTimeMinutes: recipe.cookTimeMinutes?.toString() ?? '',
    ingredients,
    sections,
    notes: recipe.notes,
    storageNotes: recipe.storageNotes,
    images: recipe.images.map((image) => ({ ...image })),
  }
}

function createEditorSections(sections: RecipeSection[]): SectionFormState[] {
  return DEFAULT_SECTION_TITLES.map((title) => {
    const existingSection = sections.find((section) => section.title.trim().toLocaleLowerCase() === title.toLocaleLowerCase())
    return existingSection ? sectionToForm(existingSection, title) : { id: createId('section'), title, steps: [createStepRow()] }
  })
}

function sectionToForm(section: RecipeSection, title: string): SectionFormState {
  return {
    id: section.id,
    title,
    steps: section.steps.length > 0 ? section.steps.map(createStepRow) : [createStepRow()],
  }
}

function toggleCategory(categoryId: string): void {
  if (form.categoryIds.includes(categoryId)) {
    form.categoryIds = form.categoryIds.filter((selectedCategoryId) => selectedCategoryId !== categoryId)
  } else {
    form.categoryIds = [...form.categoryIds, categoryId]
  }
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
    form.images = [...form.images, ...resizedImages]

    if (resizedImages.length === 0) {
      imageError.value = 'Choose one or more image files.'
    }
  } catch (error) {
    imageError.value = error instanceof Error ? error.message : 'Unable to process image.'
  } finally {
    imageProcessing.value = false
    input.value = ''
  }
}

function removeImage(imageId: string): void {
  form.images = form.images.filter((image) => image.id !== imageId)
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

function addStep(sectionId: string): void {
  const section = form.sections.find((currentSection) => currentSection.id === sectionId)

  if (!section) {
    return
  }

  section.steps = [...section.steps, createStepRow()]
}

function removeStep(sectionId: string, stepId: string): void {
  const section = form.sections.find((currentSection) => currentSection.id === sectionId)

  if (!section) {
    return
  }

  if (section.steps.length === 1) {
    section.steps[0].text = ''
    section.steps[0].timerEnabled = false
    section.steps[0].timerParts = createTimerParts()
    return
  }

  section.steps = section.steps.filter((step) => step.id !== stepId)
}

function submitRecipe(): void {
  if (!canSave.value) {
    return
  }

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
    sections: form.sections
      .map((section) => ({
        id: section.id,
        title: section.title.trim(),
        steps: section.steps
          .map((step) => {
            const timerSeconds = parseTimerSeconds(step)
            return {
              id: step.id,
              text: step.text.trim(),
              ...(timerSeconds ? { timerSeconds } : {}),
            }
          })
          .filter((step) => step.text.length > 0),
      }))
      .filter((section) => section.title.length > 0 && section.steps.length > 0),
    notes: form.notes.trim(),
    storageNotes: form.storageNotes.trim(),
  })
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

  const days = parseTimerPart(step.timerParts.days)
  const hours = parseTimerPart(step.timerParts.hours)
  const minutes = parseTimerPart(step.timerParts.minutes)
  const seconds = parseTimerPart(step.timerParts.seconds)

  if (hours > 23 || minutes > 59 || seconds > 59) {
    return undefined
  }

  const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds

  return totalSeconds > 0 ? totalSeconds : undefined
}

function parseTimerPart(value: string): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
}

function createTimerParts(): TimerParts {
  return {
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00',
  }
}

function splitTimerParts(seconds: number): TimerParts {
  const safeSeconds = Math.max(0, Math.round(seconds))
  const days = Math.floor(safeSeconds / 86400)
  const hours = Math.floor((safeSeconds % 86400) / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  return {
    days: formatTimerPart(days),
    hours: formatTimerPart(hours),
    minutes: formatTimerPart(minutes),
    seconds: formatTimerPart(remainingSeconds),
  }
}

function formatTimerPart(value: number): string {
  return value.toString().padStart(2, '0')
}

function updateTimerPart(step: StepFormRow, partName: keyof TimerParts, event: Event): void {
  const input = event.target as HTMLInputElement
  const maxValue = timerPartMax(partName)
  step.timerParts[partName] = clampTimerPart(input.value, maxValue)
}

function formatTimerInput(step: StepFormRow, partName: keyof TimerParts): void {
  const maxValue = timerPartMax(partName)
  const value = Number(clampTimerPart(step.timerParts[partName], maxValue))
  step.timerParts[partName] = formatTimerPart(value)
}

function timerPartMax(partName: keyof TimerParts): number {
  return partName === 'days' ? 99 : partName === 'hours' ? 23 : 59
}

function clampTimerPart(value: string, maxValue: number): string {
  const numericValue = value.replace(/\D/g, '')

  if (numericValue.length === 0) {
    return '00'
  }

  const parsed = Math.min(Number(numericValue), maxValue)
  return parsed.toString()
}
</script>

<template>
  <div v-if="show" class="modal-backdrop fade show"></div>
  <div v-if="show" class="modal localbite-modal show" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="recipe-modal-title">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <form class="modal-content recipe-editor" @submit.prevent="submitRecipe">
        <div class="modal-header">
          <div>
            <h2 id="recipe-modal-title" class="modal-title h4 mb-1">{{ modalTitle }}</h2>
            <p class="text-secondary mb-0">Build the recipe once, then cook from clean steps.</p>
          </div>
          <button class="btn-close" type="button" aria-label="Close" @click="emit('close')"></button>
        </div>

        <div class="modal-body">
          <section class="editor-section">
            <h3 class="section-heading">Basic Info</h3>

            <div class="mb-3">
              <label class="form-label" for="recipe-name">Recipe name</label>
              <input id="recipe-name" v-model="form.name" class="form-control recipe-name-input" type="text" required />
            </div>

            <div class="mb-3">
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

                <div v-if="categoryDropdownOpen" class="category-dropdown-menu border bg-white shadow-sm" role="listbox" aria-multiselectable="true">
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

            <div class="mb-3">
              <label class="form-label" for="recipe-description">Description</label>
              <textarea id="recipe-description" v-model="form.description" class="form-control" rows="3"></textarea>
            </div>

            <div>
              <label class="form-label" for="recipe-images">Image upload</label>
              <input id="recipe-images" class="form-control" type="file" accept="image/*" multiple @change="handleImageUpload" />
              <p v-if="imageProcessing" class="small text-secondary mb-0 mt-2">Resizing images before saving.</p>
              <p v-if="imageError.length > 0" class="small text-danger mb-0 mt-2">{{ imageError }}</p>

              <div v-if="form.images.length > 0" class="image-grid mt-3">
                <figure v-for="image in form.images" :key="image.id" class="image-preview border mb-0">
                  <img :src="image.dataUrl" :alt="image.name" />
                  <figcaption>
                    <span>{{ image.name }}</span>
                    <button class="btn btn-sm btn-light icon-only" type="button" aria-label="Remove image" @click="removeImage(image.id)">
                      <span class="material-icons" aria-hidden="true">close</span>
                    </button>
                  </figcaption>
                </figure>
              </div>
            </div>
          </section>

          <section class="editor-section">
            <h3 class="section-heading">Details</h3>
            <div class="details-grid">
              <div>
                <label class="form-label" for="recipe-servings">Servings</label>
                <input id="recipe-servings" v-model="form.servings" class="form-control" type="number" min="1" inputmode="numeric" />
              </div>
              <div>
                <label class="form-label" for="recipe-prep-time">Prep time</label>
                <div class="input-group">
                  <input id="recipe-prep-time" v-model="form.prepTimeMinutes" class="form-control" type="number" min="1" inputmode="numeric" />
                  <span class="input-group-text">min</span>
                </div>
              </div>
              <div>
                <label class="form-label" for="recipe-cook-time">Cook time</label>
                <div class="input-group">
                  <input id="recipe-cook-time" v-model="form.cookTimeMinutes" class="form-control" type="number" min="1" inputmode="numeric" />
                  <span class="input-group-text">min</span>
                </div>
              </div>
            </div>
          </section>

          <section class="editor-section">
            <div class="section-title-row">
              <h3 class="section-heading mb-0">Ingredients</h3>
              <button class="btn btn-outline-success icon-only" type="button" aria-label="Add ingredient" title="Add ingredient" @click="addIngredient">
                <span class="material-icons" aria-hidden="true">add</span>
              </button>
            </div>

            <div class="editable-list">
              <div v-for="(ingredient, ingredientIndex) in form.ingredients" :key="ingredient.id" class="ingredient-row">
                <input
                  v-model="ingredient.text"
                  class="form-control"
                  type="text"
                  :aria-label="`Ingredient ${ingredientIndex + 1}`"
                  placeholder="2 cups flour"
                />
                <button class="btn btn-outline-secondary icon-only row-remove-button" type="button" aria-label="Remove ingredient" title="Remove ingredient" @click="removeIngredient(ingredient.id)">
                  <span class="material-icons" aria-hidden="true">remove</span>
                </button>
              </div>
            </div>
          </section>

          <section class="editor-section">
            <h3 class="section-heading">Instructions</h3>

            <div class="instruction-stack">
              <section v-for="section in form.sections" :key="section.id" class="instruction-section border">
                <div class="instruction-section-header">
                  <h4 class="instruction-section-title">{{ section.title }}</h4>
                  <button class="btn btn-outline-success d-inline-flex align-items-center gap-1" type="button" @click="addStep(section.id)">
                    <span class="material-icons" aria-hidden="true">add</span>
                    <span>Add step</span>
                  </button>
                </div>

                <div class="step-list">
                  <div v-for="(step, stepIndex) in section.steps" :key="step.id" class="step-row">
                    <span class="step-number">{{ stepIndex + 1 }}</span>
                    <input
                      v-model="step.text"
                      class="form-control"
                      type="text"
                      :aria-label="`${section.title || 'Instruction'} step ${stepIndex + 1}`"
                      placeholder="Describe this step"
                    />
                    <div class="timer-field">
                      <label class="form-check timer-toggle">
                        <input v-model="step.timerEnabled" class="form-check-input" type="checkbox" />
                        <span class="form-check-label">Timer</span>
                      </label>

                      <div v-if="step.timerEnabled" class="timer-parts" role="group" :aria-label="`${section.title} step ${stepIndex + 1} timer`">
                        <label class="visually-hidden" :for="`timer-${section.id}-${step.id}-days`">Days</label>
                        <input
                          :id="`timer-${section.id}-${step.id}-days`"
                          class="form-control timer-part-input"
                          type="number"
                          min="0"
                          max="99"
                          inputmode="numeric"
                          :value="step.timerParts.days"
                          aria-label="Days"
                          @input="updateTimerPart(step, 'days', $event)"
                          @blur="formatTimerInput(step, 'days')"
                        />
                        <span class="timer-separator">:</span>

                        <label class="visually-hidden" :for="`timer-${section.id}-${step.id}-hours`">Hours</label>
                        <input
                          :id="`timer-${section.id}-${step.id}-hours`"
                          class="form-control timer-part-input"
                          type="number"
                          min="0"
                          max="23"
                          inputmode="numeric"
                          :value="step.timerParts.hours"
                          aria-label="Hours"
                          @input="updateTimerPart(step, 'hours', $event)"
                          @blur="formatTimerInput(step, 'hours')"
                        />
                        <span class="timer-separator">:</span>

                        <label class="visually-hidden" :for="`timer-${section.id}-${step.id}-minutes`">Minutes</label>
                        <input
                          :id="`timer-${section.id}-${step.id}-minutes`"
                          class="form-control timer-part-input"
                          type="number"
                          min="0"
                          max="59"
                          inputmode="numeric"
                          :value="step.timerParts.minutes"
                          aria-label="Minutes"
                          @input="updateTimerPart(step, 'minutes', $event)"
                          @blur="formatTimerInput(step, 'minutes')"
                        />
                        <span class="timer-separator">:</span>

                        <label class="visually-hidden" :for="`timer-${section.id}-${step.id}-seconds`">Seconds</label>
                        <input
                          :id="`timer-${section.id}-${step.id}-seconds`"
                          class="form-control timer-part-input"
                          type="number"
                          min="0"
                          max="59"
                          inputmode="numeric"
                          :value="step.timerParts.seconds"
                          aria-label="Seconds"
                          @input="updateTimerPart(step, 'seconds', $event)"
                          @blur="formatTimerInput(step, 'seconds')"
                        />
                      </div>
                    </div>
                    <button class="btn btn-outline-secondary icon-only step-remove-button" type="button" aria-label="Remove step" @click="removeStep(section.id, step.id)">
                      <span class="material-icons" aria-hidden="true">remove</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section class="editor-section">
            <h3 class="section-heading">Notes</h3>
            <div class="mb-3">
              <label class="form-label" for="recipe-notes">General notes</label>
              <textarea id="recipe-notes" v-model="form.notes" class="form-control" rows="3"></textarea>
            </div>
            <div>
              <label class="form-label" for="recipe-storage-notes">Storage notes</label>
              <textarea id="recipe-storage-notes" v-model="form.storageNotes" class="form-control" rows="3"></textarea>
            </div>
          </section>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline-secondary" type="button" @click="emit('close')">Cancel</button>
          <button class="btn btn-success" type="submit" :disabled="!canSave">
            {{ saveLabel }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.localbite-modal {
  display: block;
}

.modal-content {
  border-radius: 8px;
}

.recipe-editor {
  background: #fffdf7;
}

.modal-body {
  display: grid;
  gap: 18px;
}

.editor-section {
  background: rgba(255, 249, 236, 0.72);
  border: 1px solid rgba(225, 210, 180, 0.9);
  border-radius: 8px;
  display: grid;
  gap: 14px;
  padding: 16px;
}

.section-heading {
  color: #2a432a;
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
}

.recipe-name-input {
  color: #2a432a;
  font-size: 1.25rem;
  font-weight: 750;
  min-height: 48px;
}

.category-dropdown {
  position: relative;
}

.category-dropdown-button {
  min-height: 38px;
}

.category-dropdown-menu {
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
  background: #f5ead0;
}

.details-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
}

.section-title-row,
.instruction-section-header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: space-between;
}

.editable-list,
.instruction-stack,
.step-list {
  display: grid;
  gap: 10px;
}

.ingredient-row {
  display: grid;
  gap: 8px;
  grid-template-columns: 1fr;
}

.instruction-section {
  background: rgba(255, 255, 255, 0.74);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  padding: 12px;
}

.instruction-section-title {
  color: #2a432a;
  font-size: 1rem;
  font-weight: 750;
  margin: 0;
}

.step-row {
  align-items: end;
  display: grid;
  gap: 8px;
  grid-template-columns: auto minmax(0, 1fr);
}

.step-number {
  align-items: center;
  background: #f5ead0;
  border: 1px solid #d9c59c;
  border-radius: 999px;
  color: #486034;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 800;
  height: 30px;
  justify-content: center;
  margin-bottom: 4px;
  width: 30px;
}

.timer-field {
  grid-column: 2;
  display: grid;
  gap: 6px;
}

.timer-toggle {
  align-items: center;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 750;
  gap: 7px;
  margin: 0;
}

.timer-parts {
  align-items: center;
  background-color: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(72, 96, 52, 0.2);
  border-radius: 8px;
  box-shadow:
    0 7px 16px rgba(42, 67, 42, 0.08),
    inset 0 1px rgba(255, 255, 255, 0.86),
    inset 0 -1px rgba(72, 96, 52, 0.05);
  display: grid;
  gap: 2px;
  grid-template-columns: minmax(38px, 1fr) auto minmax(38px, 1fr) auto minmax(38px, 1fr) auto minmax(38px, 1fr);
  max-width: 292px;
  min-height: 38px;
  padding: 0 8px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;
}

.timer-parts:focus-within {
  background-color: rgba(255, 255, 255, 0.94);
  border-color: rgba(72, 96, 52, 0.55);
  box-shadow:
    0 0 0 3px rgba(95, 116, 68, 0.18),
    0 9px 20px rgba(42, 67, 42, 0.12),
    inset 0 1px rgba(255, 255, 255, 0.92);
}

.timer-part-input {
  appearance: textfield;
  background: transparent;
  border: 0;
  box-shadow: none;
  font-variant-numeric: tabular-nums;
  font-weight: 750;
  height: 36px;
  min-width: 0;
  padding: 0 2px;
  text-align: center;
}

.timer-part-input:hover,
.timer-part-input:focus {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.timer-part-input::-webkit-inner-spin-button,
.timer-part-input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.timer-separator {
  color: #486034;
  font-weight: 850;
  line-height: 1;
}

.step-remove-button {
  grid-column: 2;
  justify-self: start;
}

.row-remove-button {
  align-items: center;
  display: inline-flex;
  gap: 6px;
  justify-content: center;
}

.image-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.image-preview {
  border-radius: 8px;
  overflow: hidden;
}

.image-preview img {
  aspect-ratio: 4 / 3;
  display: block;
  object-fit: cover;
  width: 100%;
}

.image-preview figcaption {
  align-items: center;
  background: #fff9ec;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-height: 42px;
  padding: 8px;
}

.image-preview figcaption span {
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

@media (min-width: 576px) {
  .details-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ingredient-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}

@media (min-width: 768px) {
  .modal-body {
    gap: 20px;
  }

  .editor-section {
    padding: 18px;
  }

  .step-row {
    grid-template-columns: auto minmax(0, 1fr) minmax(248px, 300px) auto;
  }

  .timer-field,
  .step-remove-button {
    grid-column: auto;
  }
}
</style>
