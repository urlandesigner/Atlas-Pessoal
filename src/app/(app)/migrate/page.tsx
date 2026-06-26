"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CRM_STORAGE_KEY,
  normalizeLead,
  type LeadEntry,
} from "@/lib/crm/store"
import { PROPOSALS_STORAGE_KEY, normalizeProposalEntry, type ProposalEntry } from "@/lib/proposals/store"
import { CLIENTS_STORAGE_KEY, normalizeClient, type ClientEntry } from "@/lib/clients/store"
import {
  STORAGE_KEY as PROJECTS_STORAGE_KEY,
  normalizeProjectForWorkspace,
  type WorkspaceTab,
  type ProjectEntry,
} from "@/lib/projects/store"
import {
  syncLeadsToSupabase,
  syncProposalsToSupabase,
  syncClientsToSupabase,
  syncProjectsToSupabase,
} from "@/lib/supabase/data"

function readLocalCounts() {
  if (typeof window === "undefined") return null
  const parse = (key: string) => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : Object.values(parsed).flat()
    } catch {
      return []
    }
  }
  const leads = parse(CRM_STORAGE_KEY)
  const proposals = parse(PROPOSALS_STORAGE_KEY)
  const clients = parse(CLIENTS_STORAGE_KEY)
  const projectsRaw = (() => {
    try {
      const raw = localStorage.getItem(PROJECTS_STORAGE_KEY)
      if (!raw) return {}
      return JSON.parse(raw)
    } catch {
      return {}
    }
  })()
  const projectCount =
    (projectsRaw?.freelancer?.length ?? 0) +
    (projectsRaw?.professional?.length ?? 0) +
    (projectsRaw?.personal?.length ?? 0)

  return { leads: leads.length, proposals: proposals.length, clients: clients.length, projects: projectCount }
}

type MigrateStatus = "idle" | "running" | "done" | "error"

export default function MigratePage() {
  const [counts] = useState<ReturnType<typeof readLocalCounts>>(() => readLocalCounts())
  const [status, setStatus] = useState<MigrateStatus>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleMigrate() {
    setStatus("running")
    setErrorMsg(null)

    try {
      // Leads
      const leadsRaw = localStorage.getItem(CRM_STORAGE_KEY)
      const leadsData: LeadEntry[] = leadsRaw
        ? (JSON.parse(leadsRaw) as Partial<LeadEntry>[]).map(normalizeLead)
        : []

      // Proposals
      const proposalsRaw = localStorage.getItem(PROPOSALS_STORAGE_KEY)
      const proposalsData: ProposalEntry[] = proposalsRaw
        ? (JSON.parse(proposalsRaw) as Partial<ProposalEntry>[]).map(normalizeProposalEntry)
        : []

      // Clients
      const clientsRaw = localStorage.getItem(CLIENTS_STORAGE_KEY)
      const clientsData: ClientEntry[] = clientsRaw
        ? (JSON.parse(clientsRaw) as Partial<ClientEntry>[]).map(normalizeClient)
        : []

      // Projects
      const projectsRaw = localStorage.getItem(PROJECTS_STORAGE_KEY)
      const projectsParsed = projectsRaw ? JSON.parse(projectsRaw) : {}
      const workspaces: WorkspaceTab[] = ["freelancer", "professional", "personal"]
      const projectsData: Record<WorkspaceTab, ProjectEntry[]> = {
        freelancer: [],
        professional: [],
        personal: [],
      }
      for (const ws of workspaces) {
        const arr = Array.isArray(projectsParsed[ws]) ? (projectsParsed[ws] as Partial<ProjectEntry>[]) : []
        projectsData[ws] = arr.map((p) => normalizeProjectForWorkspace(ws, p as ProjectEntry))
      }

      await Promise.all([
        syncLeadsToSupabase(leadsData),
        syncProposalsToSupabase(proposalsData),
        syncClientsToSupabase(clientsData),
        syncProjectsToSupabase(projectsData),
      ])

      setStatus("done")
    } catch (err) {
      console.error("[migrate]", err)
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido")
      setStatus("error")
    }
  }

  const total = counts
    ? counts.leads + counts.proposals + counts.clients + counts.projects
    : 0

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto py-8">
      <div>
        <h1 className="text-xl font-semibold">Migração para Supabase</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transfere todos os dados do localStorage para o Supabase.
          Execute apenas uma vez.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados encontrados no localStorage</CardTitle>
          <CardDescription>
            {counts === null ? "Lendo..." : total === 0 ? "Nenhum dado encontrado." : `${total} registros para migrar.`}
          </CardDescription>
        </CardHeader>
        {counts && total > 0 && (
          <CardContent>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>Leads: <span className="text-foreground font-medium">{counts.leads}</span></li>
              <li>Propostas: <span className="text-foreground font-medium">{counts.proposals}</span></li>
              <li>Clientes: <span className="text-foreground font-medium">{counts.clients}</span></li>
              <li>Projetos: <span className="text-foreground font-medium">{counts.projects}</span></li>
            </ul>
          </CardContent>
        )}
      </Card>

      {status === "done" && (
        <div className="rounded-md bg-foreground/5 border border-foreground/10 p-4 text-sm">
          Migração concluída. Os dados já estão no Supabase.
        </div>
      )}

      {status === "error" && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Erro: {errorMsg}
        </div>
      )}

      <Button
        onClick={handleMigrate}
        disabled={status === "running" || status === "done" || total === 0}
      >
        {status === "running"
          ? "Migrando..."
          : status === "done"
          ? "Migração concluída"
          : "Migrar dados para Supabase"}
      </Button>
    </div>
  )
}
