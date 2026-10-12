// src/hooks/useImageStore.js
import { saveImage } from '../utils/idb.js'

export async function storeImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return null

  const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  await saveImage(id, file)
  return id
}