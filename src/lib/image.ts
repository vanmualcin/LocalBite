import type { RecipeImage } from '../types'
import { createId } from './ids'

const MAX_IMAGE_EDGE = 1200
const IMAGE_QUALITY = 0.78

export async function resizeImages(files: File[]): Promise<RecipeImage[]> {
  const images = files.filter((file) => file.type.startsWith('image/'))
  const resizedImages: RecipeImage[] = []

  for (const image of images) {
    resizedImages.push(await resizeImage(image))
  }

  return resizedImages
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(String(reader.result)))
    reader.addEventListener('error', () => reject(reader.error))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject(new Error('Unable to read image.')))
    image.src = src
  })
}

async function resizeImage(file: File): Promise<RecipeImage> {
  const source = await readFileAsDataUrl(file)
  const image = await loadImage(source)
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Image resizing is not available in this browser.')
  }

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  let dataUrl = canvas.toDataURL('image/webp', IMAGE_QUALITY)
  let type = 'image/webp'

  if (!dataUrl.startsWith('data:image/webp')) {
    dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
    type = 'image/jpeg'
  }

  return {
    id: createId('image'),
    name: file.name,
    dataUrl,
    type,
    width,
    height,
    size: Math.round((dataUrl.length * 3) / 4),
  }
}
