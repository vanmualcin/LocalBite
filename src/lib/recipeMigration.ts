import { DEFAULT_CATEGORY_ID, type Ingredient, type Recipe, type RecipeImage, type RecipeSection, type RecipeStep } from '../types'
import { createId } from './ids'

type UnknownRecord = Record<string, unknown>

export function normalizeRecipe(rawRecipe: unknown): Recipe {
  const source = isRecord(rawRecipe) ? rawRecipe : {}
  const now = new Date().toISOString()
  const createdAt = readString(source.createdAt) || now

  return {
    id: readString(source.id) || createId('recipe'),
    name: readString(source.name) || 'Untitled Recipe',
    description: readString(source.description),
    categoryIds: readCategoryIds(source),
    images: readImages(source.images),
    servings: readPositiveInteger(source.servings),
    prepTimeMinutes: readPositiveInteger(source.prepTimeMinutes),
    cookTimeMinutes: readPositiveInteger(source.cookTimeMinutes),
    ingredients: readIngredients(source.ingredients),
    sections: readSections(source),
    notes: readString(source.notes),
    storageNotes: readString(source.storageNotes) || readString(source.storing),
    createdAt,
    updatedAt: readString(source.updatedAt) || createdAt,
  }
}

function readCategoryIds(source: UnknownRecord): string[] {
  if (Array.isArray(source.categoryIds)) {
    const categoryIds = source.categoryIds.filter((categoryId): categoryId is string => typeof categoryId === 'string' && categoryId.trim().length > 0)

    if (categoryIds.length > 0) {
      return categoryIds
    }
  }

  const categoryId = readString(source.categoryId)
  return categoryId.length > 0 ? [categoryId] : [DEFAULT_CATEGORY_ID]
}

function readImages(value: unknown): RecipeImage[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isRecipeImage).map((image) => ({ ...image }))
}

function isRecipeImage(value: unknown): value is RecipeImage {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.dataUrl === 'string' &&
    typeof value.type === 'string' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    typeof value.size === 'number'
  )
}

function readIngredients(value: unknown): Ingredient[] {
  if (Array.isArray(value)) {
    return value
      .map((ingredient) => {
        if (typeof ingredient === 'string') {
          const text = ingredient.trim()
          return text.length > 0 ? createIngredient(text) : null
        }

        if (!isRecord(ingredient)) {
          return null
        }

        const text = readString(ingredient.text)
        return text.length > 0
          ? {
              id: readString(ingredient.id) || createId('ingredient'),
              text,
            }
          : null
      })
      .filter((ingredient): ingredient is Ingredient => ingredient !== null)
  }

  return splitTextLines(readString(value)).map(createIngredient)
}

function readSections(source: UnknownRecord): RecipeSection[] {
  const sections = readRecipeSections(source.sections)

  if (sections.length > 0) {
    return sections
  }

  const migratedSections: RecipeSection[] = []
  appendLegacyTextSection(migratedSections, 'Preparation', source.preparation)
  appendLegacyTextSection(migratedSections, 'Cooking', source.cooking)
  appendLegacyCustomSections(migratedSections, source.customSections)

  return migratedSections
}

function readRecipeSections(value: unknown): RecipeSection[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((section) => {
      if (!isRecord(section)) {
        return null
      }

      const title = readString(section.title) || readString(section.label)
      const steps = readSteps(section.steps)
      const legacyContentSteps = splitTextLines(readString(section.content)).map(createStep)
      const sectionSteps = steps.length > 0 ? steps : legacyContentSteps

      return title.length > 0 && sectionSteps.length > 0
        ? {
            id: readString(section.id) || createId('section'),
            title,
            steps: sectionSteps,
          }
        : null
    })
    .filter((section): section is RecipeSection => section !== null)
}

function readSteps(value: unknown): RecipeStep[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((step) => {
      if (typeof step === 'string') {
        return createStep(step)
      }

      if (!isRecord(step)) {
        return null
      }

      const text = readString(step.text)
      const timerSeconds = readPositiveInteger(step.timerSeconds)

      return text.length > 0
        ? {
            id: readString(step.id) || createId('step'),
            text,
            ...(timerSeconds ? { timerSeconds } : {}),
          }
        : null
    })
    .filter((step): step is RecipeStep => step !== null)
}

function appendLegacyTextSection(sections: RecipeSection[], title: string, value: unknown): void {
  const steps = splitTextLines(readString(value)).map(createStep)

  if (steps.length === 0) {
    return
  }

  sections.push({
    id: createId('section'),
    title,
    steps,
  })
}

function appendLegacyCustomSections(sections: RecipeSection[], value: unknown): void {
  if (!Array.isArray(value)) {
    return
  }

  for (const section of value) {
    if (!isRecord(section)) {
      continue
    }

    const title = readString(section.label) || readString(section.title)
    const steps = splitTextLines(readString(section.content)).map(createStep)

    if (title.length === 0 || steps.length === 0) {
      continue
    }

    sections.push({
      id: readString(section.id) || createId('section'),
      title,
      steps,
    })
  }
}

function createIngredient(text: string): Ingredient {
  return {
    id: createId('ingredient'),
    text: text.trim(),
  }
}

function createStep(text: string): RecipeStep {
  return {
    id: createId('step'),
    text: text.trim(),
  }
}

function splitTextLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readPositiveInteger(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  const integer = Math.round(value)
  return integer > 0 ? integer : undefined
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}
