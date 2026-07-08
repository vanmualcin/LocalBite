export const DEFAULT_CATEGORY_ID = 'default'

export type SortKey = 'name' | 'category' | 'created' | 'updated'

export interface Category {
  id: string
  name: string
  createdAt: string
}

export interface CategoryOption extends Category {
  count: number
}

export interface RecipeImage {
  id: string
  name: string
  dataUrl: string
  type: string
  width: number
  height: number
  size: number
}

export interface Ingredient {
  id: string
  text: string
}

export interface RecipeStep {
  id: string
  text: string
  timerSeconds?: number
}

export interface RecipeSection {
  id: string
  title: string
  steps: RecipeStep[]
}

export interface Recipe {
  id: string
  name: string
  description: string
  categoryIds: string[]
  images: RecipeImage[]
  servings?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  ingredients: Ingredient[]
  sections: RecipeSection[]
  notes: string
  storageNotes: string
  createdAt: string
  updatedAt: string
}

export interface RecipeFormPayload {
  id?: string
  name: string
  description: string
  categoryIds: string[]
  images: RecipeImage[]
  servings?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  ingredients: Ingredient[]
  sections: RecipeSection[]
  notes: string
  storageNotes: string
}

export interface RecipeCardView extends Recipe {
  categoryNames: string[]
  createdLabel: string
  updatedLabel: string
}
