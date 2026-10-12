// src/utils/idb.js
import { openDB } from 'idb'

const DB_NAME = 'notenest'
const DB_VERSION = 1
const IMAGE_STORE = 'images'

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          db.createObjectStore(IMAGE_STORE)
        }
      },
    })
  }
  return dbPromise
}

export async function saveImage(id, blob) {
  const db = await getDB()
  await db.put(IMAGE_STORE, blob, id)
}

export async function loadImage(id) {
  const db = await getDB()
  return db.get(IMAGE_STORE, id)
}

export async function deleteImage(id) {
  const db = await getDB()
  await db.delete(IMAGE_STORE, id)
}

export async function getAllImageIds() {
  const db = await getDB()
  return db.getAllKeys(IMAGE_STORE)
}

export async function clearImages() {
  const db = await getDB()
  await db.clear(IMAGE_STORE)
}