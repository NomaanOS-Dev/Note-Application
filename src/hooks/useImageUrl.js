// src/hooks/useImageUrl.js
import { useEffect, useState } from 'react'
import { loadImage } from '../utils/idb.js'

const urlCache = new Map()

export function useImageUrl(id) {
  const [url, setUrl] = useState(() => urlCache.get(id) || null)

  useEffect(() => {
    let cancelled = false

    if (!id) {
      setUrl(null)
      return
    }

    if (urlCache.has(id)) {
      setUrl(urlCache.get(id))
      return
    }

    loadImage(id).then(blob => {
      if (cancelled || !blob) return
      const objectUrl = URL.createObjectURL(blob)
      urlCache.set(id, objectUrl)
      setUrl(objectUrl)
    })

    return () => {
      cancelled = true
    }
  }, [id])

  return url
}