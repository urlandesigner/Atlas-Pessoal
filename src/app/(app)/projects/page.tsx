"use client"

import Link from "next/link"
import { useState, useSyncExternalStore } from "react"
import { FolderOpen, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  addProjectToCollection,
  createProjectFromForm,
  createProjectPath,
  emitProjectsChange,
  EMPTY_FORM,
  getProjectsServerSnapshot,
  getProjectsSnapshot,
  saveProjects,
  STATUS_LABEL,
  STATUS_OPTIONS,
  subscribeProjectsStore,
  TAB_LABEL,
  type ProjectEntry,
  type ProjectForm,
  type WorkspaceTab,
} from "@/lib/projects/store"
import {
  getClientsSnapshot,
  getClientsServerSnapshot,
  subscribeClientsStore,
  type ClientEntry,
} from "@/lib/clients/store"
import type { ProjectStatus } from "@/types"

const STATUS_BADGE_CLASS: Record<ProjectStatus, string> = {
  active: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  not_started: "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  paused: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  closed: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  inactive: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
}

function formatProjectPeriod(project: ProjectEntry) {
  if (project.started_at && project.ended_at) {
    return `${formatDate(project.started_at)} → ${formatDate(project.ended_at)}`
  }

  if (project.started_at) {
    return `${formatDate(project.started_at)} → em andamento`
  }

  if (project.ended_at) {
    return `Conclusão em ${formatDate(project.ended_at)}`
  }

  return "Sem período definido"
}

function ProjectCard({ project, workspace }: { project: ProjectEntry; workspace: WorkspaceTab }) {
  return (
    <Link href={createProjectPath(workspace, project.id)} className="block">
      <Card className="h-full cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-foreground/15 hover:bg-muted/40 hover:shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-medium">{project.name}</h3>
            <Badge variant="outline" className={cn("shrink-0 font-normal", STATUS_BADGE_CLASS[project.status])}>
              {STATUS_LABEL[project.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 pt-3">
          <p
            className={`truncate text-xs ${
              project.description?.trim() ? "text-muted-foreground" : "text-muted-foreground/60"
            }`}
          >
            {project.description?.trim() || "Sem descrição"}
          </p>

          <p
            className={`truncate text-xs ${
              project.started_at || project.ended_at ? "text-muted-foreground" : "text-muted-foreground/60"
            }`}
          >
            {formatProjectPeriod(project)}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
        <FolderOpen className="size-5 text-muted-foreground" />
      </div>
      <p className="text-center text-sm text-muted-foreground">Nenhum projeto aqui ainda.</p>
    </div>
  )
}

function NewProjectSheet({
  open,
  workspace,
  clients,
  onClose,
  onSubmit,
}: {
  open: boolean
  workspace: WorkspaceTab
  clients: ClientEntry[]
  onClose: () => void
  onSubmit: (workspace: WorkspaceTab, form: ProjectForm) => void
}) {
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM)
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceTab>(workspace)

  function set(field: keyof ProjectForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!form.name.trim()) return
    onSubmit(selectedWorkspace, form)
    setForm(EMPTY_FORM)
  }

  function handleClose() {
    setForm(EMPTY_FORM)
    onClose()
  }

  function handleClientChange(value: string) {
    const selectedClient = clients.find((client) => client.id === value)
    setForm((prev) => ({
      ...prev,
      clientId: value,
      clientName: selectedClient?.name ?? "",
    }))
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && handleClose()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[45vw] sm:data-[side=right]:max-w-[45vw]" side="right">
        <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
          <SheetTitle className="text-base">Novo projeto</SheetTitle>
          <p className="text-xs text-muted-foreground">{TAB_LABEL[selectedWorkspace]}</p>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo de projeto</label>
              <select
                value={selectedWorkspace}
                onChange={(e) => {
                  const nextWorkspace = e.target.value as WorkspaceTab
                  setSelectedWorkspace(nextWorkspace)
                  if (nextWorkspace !== "freelancer") {
                    setForm((prev) => ({ ...prev, clientId: "", clientName: "", value: "" }))
                  }
                }}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
              >
                <option value="personal">Pessoal</option>
                <option value="freelancer">Freelancer</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome *</label>
              <Input placeholder="Nome do projeto" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <Textarea
                placeholder="Sobre o projeto..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Stack</label>
              <Input
                placeholder="Ex: Next.js, TailwindCSS, Vercel"
                value={form.stack}
                onChange={(e) => set("stack", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Separe por vírgula</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data de início</label>
              <Input type="date" value={form.started_at} onChange={(e) => set("started_at", e.target.value)} />
            </div>

            {selectedWorkspace === "freelancer" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Cliente</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                  >
                    <option value="">Selecione um cliente</option>
                    {clients
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
                      .map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                  </select>
                  {clients.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum cliente cadastrado ainda. Abra a tela{" "}
                      <Link href="/freelancer/clients" className="font-medium text-foreground underline underline-offset-4">
                        Clientes
                      </Link>{" "}
                      para cadastrar.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Escolha um cliente da sua base freelancer.
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Valor (R$)</label>
                  <Input type="number" placeholder="0,00" value={form.value} onChange={(e) => set("value", e.target.value)} />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="flex flex-row gap-2 border-t px-5 py-4">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!form.name.trim()}>
            Adicionar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("personal")
  const [isAdding, setIsAdding] = useState(false)
  const allProjects = useSyncExternalStore(subscribeProjectsStore, getProjectsSnapshot, getProjectsServerSnapshot)
  const clients = useSyncExternalStore(subscribeClientsStore, getClientsSnapshot, getClientsServerSnapshot)

  const projects = [...allProjects[activeTab]].sort((a, b) => {
    if (!a.started_at && !b.started_at) return a.name.localeCompare(b.name, "pt-BR")
    if (!a.started_at) return 1
    if (!b.started_at) return -1
    return a.started_at.localeCompare(b.started_at) || a.name.localeCompare(b.name, "pt-BR")
  })

  function handleAdd(workspace: WorkspaceTab, form: ProjectForm) {
    const entry = createProjectFromForm(workspace, form)
    const next = addProjectToCollection(allProjects, workspace, entry)
    saveProjects(next)
    emitProjectsChange()
    setActiveTab(workspace)
    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Projetos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pessoal e freelancer
            </p>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="size-4" />
            Novo projeto
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as WorkspaceTab)}>
          <TabsList>
            <TabsTrigger value="personal">Pessoal</TabsTrigger>
            <TabsTrigger value="freelancer">Freelancer</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {projects.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} workspace={activeTab} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NewProjectSheet
        key={`${activeTab}-${isAdding ? "open" : "closed"}`}
        open={isAdding}
        workspace={activeTab}
        clients={clients}
        onClose={() => setIsAdding(false)}
        onSubmit={handleAdd}
      />
    </>
  )
}
