"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { fetchAllFromSupabase } from "@/lib/supabase/data"
import { hydrateLeads, emitLeadsChange } from "@/lib/crm/store"
import { hydrateProposals, emitProposalsChange } from "@/lib/proposals/store"
import { hydrateClients, emitClientsChange } from "@/lib/clients/store"
import { hydrateProjects, emitProjectsChange } from "@/lib/projects/store"

function emitAll() {
  emitLeadsChange()
  emitProposalsChange()
  emitClientsChange()
  emitProjectsChange()
}

export function AtlasStorageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicProposal = pathname.startsWith("/p/")
  const [ready, setReady] = useState(isPublicProposal)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    async function load() {
      try {
        const { leads, proposals, clients, projects } = await fetchAllFromSupabase()
        if (!active) return
        hydrateLeads(leads)
        hydrateProposals(proposals)
        hydrateClients(clients)
        hydrateProjects(projects)
        emitAll()
      } catch (err) {
        console.error("[atlas] failed to load from Supabase:", err)
      }
    }

    function clear() {
      hydrateLeads([])
      hydrateProposals([])
      hydrateClients([])
      hydrateProjects({ freelancer: [], professional: [], personal: [] })
      emitAll()
    }

    // Re-fetch whenever auth state changes so login/logout hydrate correctly.
    // onAuthStateChange fires INITIAL_SESSION on subscribe (covers first load).
    // Supabase calls are deferred out of the callback to avoid auth deadlocks.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clear()
        return
      }
      setTimeout(() => {
        void load().finally(() => {
          if (active) setReady(true)
        })
      }, 0)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
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
