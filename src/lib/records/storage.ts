import type { RecordEntry } from "./types"

const STORAGE_KEY = "atlas_records"

export function loadRecords(): RecordEntry[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecords(records: RecordEntry[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export function addRecord(record: RecordEntry): void {
  const records = loadRecords()
  records.unshift(record)
  saveRecords(records)
}

export function updateRecord(id: string, updates: Partial<RecordEntry>): void {
  const records = loadRecords()
  const idx = records.findIndex((r) => r.id === id)
  if (idx === -1) return
  records[idx] = { ...records[idx], ...updates, updatedAt: new Date().toISOString() }
  saveRecords(records)
}

export function deleteRecord(id: string): void {
  const records = loadRecords()
  saveRecords(records.filter((r) => r.id !== id))
}
