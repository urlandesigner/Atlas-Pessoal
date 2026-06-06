"use client"

export const TIMELINE_PINS_STORAGE_KEY = "atlas_timeline_pins"
export const TIMELINE_PINS_STORAGE_EVENT = "atlas-timeline-pins-change"

let cachedPinsRaw: string | null | undefined
export const DEFAULT_TIMELINE_PINS: string[] = []
let cachedPinsSnapshot: string[] = DEFAULT_TIMELINE_PINS

export function getTimelinePinsSnapshot() {
  if (typeof window === "undefined") return DEFAULT_TIMELINE_PINS

  try {
    const raw = localStorage.getItem(TIMELINE_PINS_STORAGE_KEY)
    if (raw === cachedPinsRaw) return cachedPinsSnapshot

    const snapshot = raw ? (JSON.parse(raw) as string[]) : []
    cachedPinsRaw = raw
    cachedPinsSnapshot = Array.isArray(snapshot) ? snapshot : []
    return cachedPinsSnapshot
  } catch {
    cachedPinsRaw = null
    cachedPinsSnapshot = []
    return cachedPinsSnapshot
  }
}

export function getTimelinePinsServerSnapshot() {
  return DEFAULT_TIMELINE_PINS
}

export function saveTimelinePins(ids: string[]) {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(ids)
  localStorage.setItem(TIMELINE_PINS_STORAGE_KEY, raw)
  cachedPinsRaw = raw
  cachedPinsSnapshot = ids
}

export function emitTimelinePinsChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(TIMELINE_PINS_STORAGE_EVENT))
}

export function subscribeTimelinePinsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== TIMELINE_PINS_STORAGE_KEY) return
    onStoreChange()
  }

  const handlePinsChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(TIMELINE_PINS_STORAGE_EVENT, handlePinsChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(TIMELINE_PINS_STORAGE_EVENT, handlePinsChange)
  }
}
