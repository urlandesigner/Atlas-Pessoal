"use client"

import { useEffect, useRef, useState } from "react"
import {
  ATLAS_STORAGE_SYNC_ENDPOINT,
  ATLAS_STORAGE_SYNC_INTERVAL_MS,
  collectAtlasStorage,
  hasAtlasStorageData,
  serializeAtlasStorage,
  writeAtlasStorage,
} from "@/lib/persistence/atlas-storage"

interface AtlasStorageProviderProps {
  children: React.ReactNode
  initialData: Record<string, unknown>
}

export function AtlasStorageProvider({ children, initialData }: AtlasStorageProviderProps) {
  const [ready, setReady] = useState(false)
  const lastSyncedRef = useRef<string | null>(null)

  useEffect(() => {
    const localData = collectAtlasStorage()
    const localSerialized = serializeAtlasStorage(localData)
    const remoteSerialized = serializeAtlasStorage(initialData)

    try {
      if (!hasAtlasStorageData(localData) && hasAtlasStorageData(initialData)) {
        writeAtlasStorage(initialData)
        lastSyncedRef.current = remoteSerialized
      } else {
        lastSyncedRef.current = localSerialized
        if (hasAtlasStorageData(localData) && localSerialized !== remoteSerialized) {
          void syncNow(localData).catch(() => {
            lastSyncedRef.current = localSerialized
          })
        }
      }
    } catch {
      lastSyncedRef.current = localSerialized
    }

    queueMicrotask(() => setReady(true))
  }, [initialData])

  useEffect(() => {
    if (!ready) return

    let syncing = false

    async function syncIfChanged() {
      if (syncing) return

      const currentData = collectAtlasStorage()
      const serialized = serializeAtlasStorage(currentData)

      if (serialized === lastSyncedRef.current) return

      syncing = true

      try {
        await syncNow(currentData)
      } finally {
        syncing = false
      }
    }

    const intervalId = window.setInterval(() => {
      void syncIfChanged()
    }, ATLAS_STORAGE_SYNC_INTERVAL_MS)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") void syncIfChanged()
    }

    const handlePageHide = () => {
      void syncIfChanged()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pagehide", handlePageHide)
    }
  }, [ready])

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando dados...</div>
  }

  return <>{children}</>

  async function syncNow(data: Record<string, unknown>) {
    const serialized = serializeAtlasStorage(data)

    const response = await fetch(ATLAS_STORAGE_SYNC_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
      keepalive: true,
    })

    if (!response.ok) throw new Error(`POST ${response.status}`)

    lastSyncedRef.current = serialized
  }
}
