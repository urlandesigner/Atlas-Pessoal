export const ATLAS_STORAGE_PREFIX = "atlas_"
export const ATLAS_STORAGE_SYNC_ENDPOINT = "/api/local-data"
export const ATLAS_STORAGE_SYNC_INTERVAL_MS = 15000

export type AtlasStoragePayload = {
  updatedAt: string
  data: Record<string, unknown>
}

export function hasAtlasStorageData(data: Record<string, unknown>) {
  return Object.keys(data).length > 0
}

export function serializeAtlasStorage(data: Record<string, unknown>) {
  return JSON.stringify(data)
}
