"use client"

export {
  ATLAS_STORAGE_PREFIX,
  ATLAS_STORAGE_SYNC_ENDPOINT,
  ATLAS_STORAGE_SYNC_INTERVAL_MS,
  ATLAS_STORAGE_UPDATED_AT_KEY,
  hasAtlasStorageData,
  serializeAtlasStorage,
  type AtlasStoragePayload,
} from "./atlas-storage-shared"
import { ATLAS_STORAGE_PREFIX, ATLAS_STORAGE_UPDATED_AT_KEY } from "./atlas-storage-shared"

export function collectAtlasStorage(): Record<string, unknown> {
  if (typeof window === "undefined") return {}

  const data: Record<string, unknown> = {}

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key || !key.startsWith(ATLAS_STORAGE_PREFIX)) continue

    const raw = localStorage.getItem(key)
    if (raw == null) continue

    try {
      data[key] = JSON.parse(raw)
    } catch {
      data[key] = raw
    }
  }

  return data
}

export function writeAtlasStorage(data: Record<string, unknown>) {
  if (typeof window === "undefined") return

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(ATLAS_STORAGE_PREFIX)) continue
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export function getAtlasStorageUpdatedAt() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ATLAS_STORAGE_UPDATED_AT_KEY)
}

export function setAtlasStorageUpdatedAt(updatedAt: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(ATLAS_STORAGE_UPDATED_AT_KEY, updatedAt)
}
