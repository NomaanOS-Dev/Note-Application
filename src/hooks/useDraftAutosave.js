// src/hooks/useDraftAutosave.js
import { useEffect, useRef } from 'react'

const DRAFT_PREFIX = 'notenest.draft.'

export function draftKey(noteId) {
  return `${DRAFT_PREFIX}${noteId || 'new'}`
}

export function loadDraft(noteId) {
  try {
    const raw = localStorage.getItem(draftKey(noteId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearDraft(noteId) {
  try {
    localStorage.removeItem(draftKey(noteId))
  } catch {}
}

export function useDraftAutosave(noteId, value, delay = 2000) {
  const timer = useRef(null)

  useEffect(() => {
    if (!value) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(noteId), JSON.stringify(value))
      } catch {}
    }, delay)

    return () => clearTimeout(timer.current)
  }, [noteId, value, delay])
}