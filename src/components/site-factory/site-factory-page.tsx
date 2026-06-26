"use client"

import { SITE_FACTORY_TEMPLATE_MAP } from "@atlas/site-factory"
import { Download, FolderOpen, Plus, Sparkles } from "lucide-react"
import { useMemo, useState, useSyncExternalStore } from "react"

import { SiteFactoryEditor } from "@/components/site-factory/site-factory-editor"
import { SiteFactoryTabs } from "@/components/site-factory/site-factory-tabs"
import type { SiteFactoryProjectRecord } from "@/components/site-factory/site-factory-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import {
  emitSiteFactoryChange,
  getSiteFactoryServerSnapshot,
  getSiteFactorySnapshot,
  saveSiteFactoryProjects,
  subscribeSiteFactoryStore,
} from "@/lib/site-factory/store"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function EmptyState() {
  return (
    <Card className="border-dashed py-0">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
          <Sparkles className="size-5 text-muted-foreground" />
        </div>
        <div className="grid gap-1">
          <p className="text-base font-medium">Nenhum projeto criado ainda</p>
          <p className="text-sm text-muted-foreground">
            Gere um briefing inicial para já sair com arquivos base e prompts organizados.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function SiteFactoryPage() {
  const projects = useSyncExternalStore(
    subscribeSiteFactoryStore,
    getSiteFactorySnapshot,
    getSiteFactoryServerSnapshot
  )
  const [isAdding, setIsAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [projects]
  )

  const selectedProject =
    sortedProjects.find((project) => project.id === selectedId) ?? sortedProjects[0] ?? null

  function persist(next: SiteFactoryProjectRecord[]) {
    saveSiteFactoryProjects(next)
    emitSiteFactoryChange()
  }

  function handleCreate(project: SiteFactoryProjectRecord) {
    persist([project, ...projects])
    setSelectedId(project.id)
  }

  async function handleCopy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      setFeedbackMessage(`${label} copiado com sucesso.`)
      setTimeout(() => setFeedbackMessage(null), 1800)
    } catch {
      setFeedbackMessage(null)
    }
  }

  function handleDownloadAllFiles(project: SiteFactoryProjectRecord) {
    project.files.forEach((file, index) => {
      const blob = new Blob([file.content], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = file.name.toLowerCase()

      window.setTimeout(() => {
        link.click()
        URL.revokeObjectURL(url)
      }, index * 120)
    })

    setFeedbackMessage(`${project.files.length} arquivos .md enviados para download.`)
    setTimeout(() => setFeedbackMessage(null), 2200)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="AI Module"
          title="Site Factory"
          description="Estruture briefings, gere arquivos em markdown e organize prompts prontos para Claude."
          actions={
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="size-4" />
              Novo projeto
            </Button>
          }
        />

        {feedbackMessage ? (
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {feedbackMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[21rem_minmax(0,1fr)]">
          <div className="grid gap-4 self-start">
            <Card className="py-0">
              <CardHeader className="px-4 py-4">
                <CardTitle className="text-base">Projetos</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 px-4 pb-4">
                {sortedProjects.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    A listagem vai aparecer aqui assim que você gerar o primeiro briefing.
                  </div>
                ) : (
                  sortedProjects.map((project) => {
                    const active = selectedProject?.id === project.id
                    const template = SITE_FACTORY_TEMPLATE_MAP[project.templateId]

                    return (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => setSelectedId(project.id)}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-background hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{project.name}</p>
                            <p
                              className={`mt-1 line-clamp-2 text-xs ${
                                active ? "text-background/75" : "text-muted-foreground"
                              }`}
                            >
                              {project.summary}
                            </p>
                          </div>
                          <Badge variant="outline" className={active ? "border-background/25 text-background" : "font-normal"}>
                            {template.label}
                          </Badge>
                        </div>
                        <div
                          className={`mt-3 flex items-center gap-2 text-xs ${
                            active ? "text-background/70" : "text-muted-foreground"
                          }`}
                        >
                          <FolderOpen className="size-3.5" />
                          {formatDate(project.updatedAt)}
                        </div>
                      </button>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0">
            {!selectedProject ? (
              <EmptyState />
            ) : (
              <Card className="py-0">
                <CardHeader className="border-b px-5 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">{selectedProject.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{selectedProject.summary}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {SITE_FACTORY_TEMPLATE_MAP[selectedProject.templateId].label}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        {selectedProject.files.length} arquivos
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        {selectedProject.prompts.length} prompts
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadAllFiles(selectedProject)}>
                        <Download className="size-3.5" />
                        Baixar .md
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 py-5">
                  <SiteFactoryTabs project={selectedProject} onCopy={handleCopy} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <SiteFactoryEditor open={isAdding} onClose={() => setIsAdding(false)} onSubmit={handleCreate} />
    </>
  )
}
