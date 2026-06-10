"use client"

import { useEffect } from "react"
import { initLeadSeeds } from "@/lib/crm/store"

export function LeadSeedInitializer() {
  useEffect(() => {
    initLeadSeeds()
  }, [])
  return null
}
