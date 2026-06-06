"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Trash2Icon,
  ChevronRightIcon,
  AlertTriangleIcon,
  PencilIcon,
  SaveIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ATUACOES } from "./atuacao-picker"
import { AREAS } from "./area-picker"
import { AtuacaoPicker } from "./atuacao-picker"
import { AreaPicker } from "./area-picker"
import { ImpactSelector, SCOPES } from "./impact-selector"
import type {
  RecordEntry,
  EnrichedFields,
  ImpactLevel,
  ImpactScope,
  AtuacaoType,
  AreaType,
} from "@/lib/records/types"

const LEVEL_LABELS: Record<ImpactLevel, string> = {
  1: "Baixo",
  2: "Médio",
  3: "Alto",
  4: "Estratégico",
  5: "Transformacional",
}

const FIELD_LABELS: Record<keyof EnrichedFields, string> = {
  title: "Título",
  context: "Contexto",
  objective: "Objetivo",
  contribution: "Contribuição",
  decisions: "Decisões",
  impact: "Impacto",
  learnings: "Aprendizados",
}

// Title is rendered as a heading; these are shown as body sections
const BODY_FIELDS: (keyof EnrichedFields)[] = [
  "context",
  "objective",
  "contribution",
  "decisions",
  "impact",
  "learnings",
]

interface RecordDetailProps {
  record: RecordEntry | null
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, updates: Partial<RecordEntry>) => void
  onDelete: (id: string) => void
}

export function RecordDetail({
  record,
  onOpenChange,
  onUpdate,
  onDelete,
}: RecordDetailProps) {
  return (
    <Dialog
      open={!!record}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false)
      }}
    >
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden">
        {record && (
          <DetailBody
            key={`${record.id}-${record.updatedAt}`}
            record={record}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function DetailBody({
  record,
  onUpdate,
  onDelete,
}: {
  record: RecordEntry
  onUpdate: (id: string, updates: Partial<RecordEntry>) => void
  onDelete: (id: string) => void
}) {
  const [showRaw, setShowRaw] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(record.enriched.title)
  const [draftProjectName, setDraftProjectName] = useState(record.projectName ?? "")
  const [draftContext, setDraftContext] = useState(record.enriched.context)
  const [draftContribution, setDraftContribution] = useState(record.enriched.contribution)
  const [draftImpact, setDraftImpact] = useState(record.enriched.impact)
  const [draftAtuacao, setDraftAtuacao] = useState<AtuacaoType>(record.atuacao)
  const [draftArea, setDraftArea] = useState<AreaType>(record.area)
  const [draftScope, setDraftScope] = useState<ImpactScope>(record.impactScope)
  const [draftLevel, setDraftLevel] = useState<ImpactLevel>(record.impactLevel)
  const [draftTags, setDraftTags] = useState(record.tags.join(", "))

  const atuacao = ATUACOES.find((a) => a.value === record.atuacao)
  const area = AREAS.find((a) => a.value === record.area)
  const scopeLabel = SCOPES.find((s) => s.value === record.impactScope)?.label

  const timeAgo = formatDistanceToNow(new Date(record.createdAt), {
    addSuffix: true,
    locale: ptBR,
  })

  function handleSaveEdit() {
    const normalizedTags = draftTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    const enriched: EnrichedFields = {
      ...record.enriched,
      title: draftTitle.trim() || record.enriched.title,
      context: draftContext.trim() || record.enriched.context,
      contribution: draftContribution.trim() || record.enriched.contribution,
      impact: draftImpact.trim() || record.enriched.impact,
    }

    onUpdate(record.id, {
      enriched,
      projectName: draftProjectName.trim() || undefined,
      atuacao: draftAtuacao,
      area: draftArea,
      impactScope: draftScope,
      impactLevel: draftLevel,
      tags: normalizedTags,
    })

    setEditing(false)
  }

  return (
    <>
      {/* Header: metadata */}
      <div className="flex flex-col gap-3 border-b px-6 py-4 shrink-0">
        <div className="flex items-center gap-2 pr-8">
          {atuacao && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                atuacao.baseClass
              )}
            >
              <atuacao.icon className="size-3" />
              {atuacao.label}
            </span>
          )}
          {area && (
            <span className="text-[11px] text-muted-foreground">
              {area.label}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {([1, 2, 3, 4, 5] as const).map((l) => (
              <div
                key={l}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  l <= record.impactLevel ? "bg-violet-500" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        <h2 className="text-base font-semibold leading-snug tracking-tight pr-8">
          {record.enriched.title}
        </h2>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{LEVEL_LABELS[record.impactLevel]}</span>
          {scopeLabel && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span>{scopeLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Body: enriched fields */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        {editing ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Titulo
              </span>
              <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Projeto
              </span>
              <Input value={draftProjectName} onChange={(e) => setDraftProjectName(e.target.value)} placeholder="Nome do projeto" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Contexto
              </span>
              <Textarea value={draftContext} onChange={(e) => setDraftContext(e.target.value)} className="min-h-[110px] resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Solucao / contribuicao
              </span>
              <Textarea value={draftContribution} onChange={(e) => setDraftContribution(e.target.value)} className="min-h-[110px] resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Impacto
              </span>
              <Textarea value={draftImpact} onChange={(e) => setDraftImpact(e.target.value)} className="min-h-[110px] resize-none" />
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Tipo de atuacao
                  </span>
                  <AtuacaoPicker value={draftAtuacao} onChange={setDraftAtuacao} />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Area
                  </span>
                  <AreaPicker value={draftArea} onChange={setDraftArea} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Tags
                  </span>
                  <Input
                    value={draftTags}
                    onChange={(e) => setDraftTags(e.target.value)}
                    placeholder="Ex: IA, Cross-team, Produto"
                  />
                  <p className="text-[11px] text-muted-foreground">Separe as tags por virgula.</p>
                </div>
              </div>

              <ImpactSelector
                scope={draftScope}
                level={draftLevel}
                onScopeChange={setDraftScope}
                onLevelChange={setDraftLevel}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {BODY_FIELDS.map((key) => {
              const value = record.enriched[key]
              if (!value) return null
              return (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {FIELD_LABELS[key]}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {value}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Original entry toggle */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRightIcon
              className={cn(
                "size-3 transition-transform duration-200",
                showRaw && "rotate-90"
              )}
            />
            Ver entrada original
          </button>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-out",
              showRaw ? "max-h-60 opacity-100 mt-2.5" : "max-h-0 opacity-0"
            )}
          >
            <div className="rounded-lg border bg-muted/30 px-4 py-3 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {record.raw}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: delete */}
      <div className="flex items-center border-t px-6 py-3 shrink-0 bg-muted/30">
        {editing ? (
          <div className="flex w-full items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              className="ml-auto gap-1.5"
              disabled={!draftTitle.trim()}
            >
              <SaveIcon className="size-3.5" />
              Salvar alteracoes
            </Button>
          </div>
        ) : confirmDelete ? (
          <div className="flex items-center gap-2 w-full">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangleIcon className="size-3.5 text-destructive" />
              Excluir permanentemente? Esta ação não pode ser desfeita.
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(record.id)}
                className="gap-1.5"
              >
                <Trash2Icon className="size-3.5" />
                Excluir
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="gap-1.5"
            >
              <PencilIcon className="size-3.5" />
              Editar registro
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon className="size-3.5" />
              Excluir registro
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
