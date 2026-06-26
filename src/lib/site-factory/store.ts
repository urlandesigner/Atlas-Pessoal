"use client"

import type { SiteFactoryProjectRecord } from "@/components/site-factory/site-factory-types"

export const SITE_FACTORY_STORAGE_KEY = "atlas_site_factory_projects"
export const SITE_FACTORY_STORAGE_EVENT = "atlas-site-factory-change"

const EMPTY_SITE_FACTORY_SNAPSHOT: SiteFactoryProjectRecord[] = []

let cachedSiteFactorySnapshot: SiteFactoryProjectRecord[] = EMPTY_SITE_FACTORY_SNAPSHOT
let didHydrateSiteFactorySnapshot = false

function normalizeRecord(record: SiteFactoryProjectRecord): SiteFactoryProjectRecord {
  return {
    ...record,
    files: Array.isArray(record.files) ? record.files : [],
    prompts: Array.isArray(record.prompts) ? record.prompts : [],
  }
}

function readStorage(): SiteFactoryProjectRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(SITE_FACTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((record) => normalizeRecord(record as SiteFactoryProjectRecord))
  } catch {
    return []
  }
}

export function getSiteFactoryServerSnapshot() {
  return EMPTY_SITE_FACTORY_SNAPSHOT
}

export function getSiteFactorySnapshot() {
  if (typeof window === "undefined") return cachedSiteFactorySnapshot
  if (!didHydrateSiteFactorySnapshot) {
    cachedSiteFactorySnapshot = readStorage()
    didHydrateSiteFactorySnapshot = true
  }
  return cachedSiteFactorySnapshot
}

export function saveSiteFactoryProjects(data: SiteFactoryProjectRecord[]) {
  const snapshot = data.map(normalizeRecord)
  cachedSiteFactorySnapshot = snapshot
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SITE_FACTORY_STORAGE_KEY, JSON.stringify(snapshot))
  }
}

export function emitSiteFactoryChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(SITE_FACTORY_STORAGE_EVENT))
}

export function subscribeSiteFactoryStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleChange = () => onStoreChange()
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SITE_FACTORY_STORAGE_KEY) {
      cachedSiteFactorySnapshot = readStorage()
      didHydrateSiteFactorySnapshot = true
      onStoreChange()
    }
  }

  window.addEventListener(SITE_FACTORY_STORAGE_EVENT, handleChange)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(SITE_FACTORY_STORAGE_EVENT, handleChange)
    window.removeEventListener("storage", handleStorage)
  }
}
