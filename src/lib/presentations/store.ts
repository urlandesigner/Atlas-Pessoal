"use client"

export type PresentationStatus = "done" | "scheduled" | "not_done"

export interface PresentationEntry {
  id: string
  title: string
  description: string | null
  sharedWith: string | null
  date: string | null
  link: string | null
  status: PresentationStatus
  created_at: string
}

export interface PresentationForm {
  title: string
  description: string
  sharedWith: string
  date: string
  link: string
  status: PresentationStatus
}

export const PRESENTATIONS_STORAGE_KEY = "atlas_presentations"
export const PRESENTATIONS_STORAGE_EVENT = "atlas-presentations-change"

export const EMPTY_PRESENTATION_FORM: PresentationForm = {
  title: "",
  description: "",
  sharedWith: "",
  date: "",
  link: "",
  status: "done",
}

const SEED: PresentationEntry[] = [
  {
    id: "pr1",
    title: "AI First Design",
    description: null,
    sharedWith: null,
    date: null,
    link: null,
    status: "done",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "pr2",
    title: "Boas práticas e processo AI First",
    description: null,
    sharedWith: null,
    date: null,
    link: null,
    status: "done",
    created_at: "2026-01-02T00:00:00.000Z",
  },
]

export const DEFAULT_PRESENTATIONS = SEED

let cachedPresentationsRaw: string | null | undefined
let cachedPresentationsSnapshot: PresentationEntry[] = DEFAULT_PRESENTATIONS

function normalizeLink(url: string | null | undefined) {
  if (!url?.trim()) return null
  return /^https?:\/\//i.test(url) ? url.trim() : `https://${url.trim()}`
}

function normalizeStatus(status: PresentationStatus | string | null | undefined): PresentationStatus {
  return status === "scheduled" || status === "not_done" || status === "done" ? status : "done"
}

function normalizePresentation(entry: Partial<PresentationEntry>): PresentationEntry {
  return {
    id: entry.id ?? crypto.randomUUID(),
    title: entry.title?.trim() ?? "",
    description: entry.description?.trim() || null,
    sharedWith: entry.sharedWith?.trim() || null,
    date: entry.date || null,
    link: normalizeLink(entry.link),
    status: normalizeStatus(entry.status),
    created_at: entry.created_at ?? new Date().toISOString(),
  }
}

export function getPresentationsSnapshot() {
  if (typeof window === "undefined") return DEFAULT_PRESENTATIONS

  try {
    const raw = localStorage.getItem(PRESENTATIONS_STORAGE_KEY)
    if (raw === cachedPresentationsRaw) return cachedPresentationsSnapshot

    const snapshot = raw ? (JSON.parse(raw) as Partial<PresentationEntry>[]).map(normalizePresentation) : DEFAULT_PRESENTATIONS
    cachedPresentationsRaw = raw
    cachedPresentationsSnapshot = snapshot
    return snapshot
  } catch {
    cachedPresentationsRaw = null
    cachedPresentationsSnapshot = DEFAULT_PRESENTATIONS
    return cachedPresentationsSnapshot
  }
}

export function getPresentationsServerSnapshot() {
  return DEFAULT_PRESENTATIONS
}

export function savePresentations(data: PresentationEntry[]) {
  if (typeof window === "undefined") return
  const raw = JSON.stringify(data)
  localStorage.setItem(PRESENTATIONS_STORAGE_KEY, raw)
  cachedPresentationsRaw = raw
  cachedPresentationsSnapshot = data
}

export function emitPresentationsChange() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(PRESENTATIONS_STORAGE_EVENT))
}

export function subscribePresentationsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== PRESENTATIONS_STORAGE_KEY) return
    onStoreChange()
  }

  const handlePresentationsChange = () => onStoreChange()

  window.addEventListener("storage", handleStorage)
  window.addEventListener(PRESENTATIONS_STORAGE_EVENT, handlePresentationsChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(PRESENTATIONS_STORAGE_EVENT, handlePresentationsChange)
  }
}

export function createPresentationFromForm(form: PresentationForm): PresentationEntry {
  return normalizePresentation({
    title: form.title,
    description: form.description,
    sharedWith: form.sharedWith,
    date: form.date,
    link: form.link,
    status: form.status,
  })
}

export function addPresentationToCollection(items: PresentationEntry[], entry: PresentationEntry) {
  return [entry, ...items]
}

export function updatePresentationInCollection(
  items: PresentationEntry[],
  presentationId: string,
  updates: PresentationForm
) {
  return items.map((item) =>
    item.id === presentationId
      ? normalizePresentation({
          ...item,
          title: updates.title,
          description: updates.description,
          sharedWith: updates.sharedWith,
          date: updates.date,
          link: updates.link,
          status: updates.status,
        })
      : item
  )
}

export function deletePresentationFromCollection(items: PresentationEntry[], presentationId: string) {
  return items.filter((item) => item.id !== presentationId)
}

export function createPresentationForm(entry: PresentationEntry): PresentationForm {
  return {
    title: entry.title,
    description: entry.description ?? "",
    sharedWith: entry.sharedWith ?? "",
    date: entry.date ?? "",
    link: entry.link ?? "",
    status: entry.status,
  }
}
