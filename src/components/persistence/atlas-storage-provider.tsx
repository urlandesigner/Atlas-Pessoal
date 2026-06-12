"use client"

import { useEffect, useState } from "react"
import { fetchAllFromSupabase } from "@/lib/supabase/data"
import { hydrateLeads, emitLeadsChange } from "@/lib/crm/store"
import { hydrateProposals, emitProposalsChange } from "@/lib/proposals/store"
import { hydrateClients, emitClientsChange } from "@/lib/clients/store"
import { hydrateProjects, emitProjectsChange } from "@/lib/projects/store"

export function AtlasStorageProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchAllFromSupabase()
      .then(({ leads, proposals, clients, projects }) => {
        hydrateLeads(leads)
        hydrateProposals(proposals)
        hydrateClients(clients)
        hydrateProjects(projects)
        emitLeadsChange()
        emitProposalsChange()
        emitClientsChange()
        emitProjectsChange()
      })
      .catch((err) => console.error("[atlas] failed to load from Supabase:", err))
      .finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando dados...
      </div>
    )
  }

  return <>{children}</>
}
