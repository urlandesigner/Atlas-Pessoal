"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getStageFieldStatus,
  PIPELINE_STAGE_LABEL,
  type LeadEntry,
  type PipelineStage,
} from "@/lib/crm/store"
import { STAGE_META } from "./stage-meta"

interface StageChecklistProps {
  lead: LeadEntry
  stage: PipelineStage
  className?: string
}

/**
 * A compact checklist that shows which fields of a stage are filled,
 * with a thin completion meter. Standardizes the "what's left" view.
 */
export function StageChecklist({ lead, stage, className }: StageChecklistProps) {
  const items = getStageFieldStatus(lead, stage)
  const filled = items.filter((i) => i.filled).length
  const total = items.length
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0
  const meta = STAGE_META[stage]
  const Icon = meta.icon

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card p-4",
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-foreground" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-none">{PIPELINE_STAGE_LABEL[stage]}</p>
          <p className="mt-1 text-xs text-muted-foreground">{meta.tagline}</p>
        </div>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {filled}/{total}
        </span>
      </div>

      {/* Completion meter */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                item.filled
                  ? "border-foreground bg-foreground text-background"
                  : "border-border"
              )}
            >
              {item.filled && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            <span
              className={cn(
                "truncate text-xs transition-colors",
                item.filled ? "text-foreground" : "text-muted-foreground/70"
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
