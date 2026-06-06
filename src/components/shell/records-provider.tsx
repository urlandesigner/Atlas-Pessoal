"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { RecordEntry } from "@/lib/records/types"
import { loadRecords, addRecord, updateRecord, deleteRecord } from "@/lib/records/storage"
import { QuickCapture } from "@/components/records/quick-capture"
import { RecordDetail } from "@/components/records/record-detail"

interface RecordsContextValue {
  records: RecordEntry[]
  openCapture: () => void
  addNewRecord: (record: RecordEntry) => void
  openDetail: (record: RecordEntry) => void
  updateExistingRecord: (id: string, updates: Partial<RecordEntry>) => void
  deleteExistingRecord: (id: string) => void
}

const RecordsContext = createContext<RecordsContextValue>({
  records: [],
  openCapture: () => {},
  addNewRecord: () => {},
  openDetail: () => {},
  updateExistingRecord: () => {},
  deleteExistingRecord: () => {},
})

export function useRecords() {
  return useContext(RecordsContext)
}

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<RecordEntry[]>([])
  const [open, setOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<RecordEntry | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecords(loadRecords())
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // Global Cmd+N / Ctrl+N shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        // Only intercept if not in a text field (unless modal is already open)
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === "TEXTAREA" || tag === "INPUT") return
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const openCapture = useCallback(() => setOpen(true), [])

  const addNewRecord = useCallback((record: RecordEntry) => {
    addRecord(record)
    setRecords((prev) => [record, ...prev])
    setOpen(false)
  }, [])

  const openDetail = useCallback((record: RecordEntry) => {
    setDetailRecord(record)
  }, [])

  const updateExistingRecord = useCallback((id: string, updates: Partial<RecordEntry>) => {
    const updatedAt = new Date().toISOString()
    updateRecord(id, updates)
    setRecords((prev) =>
      prev.map((record) =>
        record.id === id ? { ...record, ...updates, updatedAt } : record
      )
    )
    setDetailRecord((current) =>
      current?.id === id ? { ...current, ...updates, updatedAt } : current
    )
  }, [])

  const deleteExistingRecord = useCallback((id: string) => {
    deleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setDetailRecord(null)
  }, [])

  return (
    <RecordsContext
      value={{
        records,
        openCapture,
        addNewRecord,
        openDetail,
        updateExistingRecord,
        deleteExistingRecord,
      }}
    >
      {children}
      <QuickCapture open={open} onOpenChange={setOpen} onSave={addNewRecord} />
      <RecordDetail
        record={detailRecord}
        onOpenChange={(o) => {
          if (!o) setDetailRecord(null)
        }}
        onUpdate={updateExistingRecord}
        onDelete={deleteExistingRecord}
      />
    </RecordsContext>
  )
}
