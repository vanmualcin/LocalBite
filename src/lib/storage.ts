import type { Category, Recipe } from '../types'
import { normalizeRecipe } from './recipeMigration'

const DB_NAME = 'hungry-codex'
const DB_VERSION = 1
const CATEGORY_STORE = 'categories'
const RECIPE_STORE = 'recipes'

let dbPromise: Promise<IDBDatabase> | null = null

export async function getCategories(): Promise<Category[]> {
  return getAll<Category>(CATEGORY_STORE)
}

export async function getRecipes(): Promise<Recipe[]> {
  const recipes = await getAll<unknown>(RECIPE_STORE)
  return recipes.map(normalizeRecipe)
}

export async function saveCategory(category: Category): Promise<void> {
  return putRecord(CATEGORY_STORE, category)
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  return putRecord(RECIPE_STORE, recipe)
}

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.addEventListener('upgradeneeded', () => {
      const database = request.result

      if (!database.objectStoreNames.contains(CATEGORY_STORE)) {
        database.createObjectStore(CATEGORY_STORE, { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains(RECIPE_STORE)) {
        database.createObjectStore(RECIPE_STORE, { keyPath: 'id' })
      }
    })

    request.addEventListener('success', () => resolve(request.result))
    request.addEventListener('error', () => reject(request.error))
  })

  return dbPromise
}

async function getAll<T>(storeName: string): Promise<T[]> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.addEventListener('success', () => resolve(request.result as T[]))
    request.addEventListener('error', () => reject(request.error))
  })
}

async function putRecord<T>(storeName: string, record: T): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(record)

    request.addEventListener('success', () => resolve())
    request.addEventListener('error', () => reject(request.error))
  })
}
