"use client"

import { useState } from "react"
import type { Project, ProjectStatus } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ProjectEntry = Project & { clientName: string }

const PROJECTS: ProjectEntry[] = [
  {
    id: "1",
    user_id: "me",
    workspace: "freelancer",
    name: "Site Dra. Beatriz",
    clientName: "Dra. Beatriz",
    description: null,
    status: "active",
    stack: [],
    value: null,
    started_at: null,
    ended_at: null,
    links: [],
    client_id: null,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    user_id: "me",
    workspace: "freelancer",
    name: "Site Dr. Doglas",
    clientName: "Dr. Doglas",
    description: null,
    status: "active",
    stack: [],
    value: null,
    started_at: null,
    ended_at: null,
    links: [],
    client_id: null,
    created_at: "",
    updated_at: "",
  },
]

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Ativo",
  not_started: "Não iniciado",
  paused: "Pausado",
  closed: "Concluído",
  inactive: "Cancelado",
}

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

function ProjectCard({
  project,
  onClick,
}: {
  project: ProjectEntry
  onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">{project.clientName}</p>
            <h3 className="font-medium text-sm mt-0.5">{project.name}</h3>
          </div>
          <Badge variant="outline" className={cn("shrink-0 font-normal", STATUS_BADGE_CLASS[project.status])}>
            {STATUS_LABEL[project.status]}
          </Badge>
        </div>
      </CardHeader>

      {(project.description || project.stack.length > 0 || project.started_at) && (
        <CardContent className="flex flex-col gap-3">
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
          {project.stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.stack.map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs font-normal">
                  {tech}
                </Badge>
              ))}
            </div>
          )}
          {project.started_at && (
            <p className="text-xs text-muted-foreground">
              {formatDate(project.started_at)} →{" "}
              {project.ended_at ? formatDate(project.ended_at) : "em andamento"}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function ProjectDrawer({
  project,
  onClose,
}: {
  project: ProjectEntry | null
  onClose: () => void
}) {
  return (
    <Sheet open={!!project} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col gap-0 p-0" side="right">
        {project && (
          <>
            <SheetHeader className="px-5 pt-5 pb-4 border-b pr-12">
              <p className="text-xs text-muted-foreground">{project.clientName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <SheetTitle className="text-base">{project.name}</SheetTitle>
                <Badge variant="outline" className={cn("font-normal", STATUS_BADGE_CLASS[project.status])}>{STATUS_LABEL[project.status]}</Badge>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-5 px-5 py-5">
                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Sobre</p>
                  <p className="text-sm text-muted-foreground">
                    {project.description ?? "—"}
                  </p>
                </section>

                <Separator />

                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Stack</p>
                  {project.stack.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {project.stack.map((tech) => (
                        <Badge key={tech} variant="outline" className="font-normal">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </section>

                <Separator />

                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Período</p>
                  <p className="text-sm text-muted-foreground">
                    {project.started_at
                      ? `${formatDate(project.started_at)} → ${project.ended_at ? formatDate(project.ended_at) : "em andamento"}`
                      : "—"}
                  </p>
                </section>

                <Separator />

                <section>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Valor</p>
                  <p className="text-sm text-muted-foreground">
                    {project.value != null
                      ? project.value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "—"}
                  </p>
                </section>

                {project.links.length > 0 && (
                  <>
                    <Separator />
                    <section>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Links</p>
                      <div className="flex flex-col gap-1.5">
                        {project.links.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function FreelancerProjectsPage() {
  const [selected, setSelected] = useState<ProjectEntry | null>(null)

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projetos Freelancer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sites, sistemas e trabalhos externos
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => setSelected(project)}
            />
          ))}
        </div>
      </div>

      <ProjectDrawer project={selected} onClose={() => setSelected(null)} />
    </>
  )
}
