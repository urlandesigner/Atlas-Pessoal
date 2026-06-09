"use client"

import { cn } from "@/lib/utils"
import { PIPELINE_STAGE_LABEL, type PipelineStage } from "@/lib/crm/store"
import { STAGE_META } from "./stage-meta"

interface StageBadgeProps {
  stage: PipelineStage
  /** When true, renders a filled (high-emphasis) chip. */
  solid?: boolean
  className?: string
}

/**
 * Standardized pipeline-stage chip used across list, kanban and detail views.
 * Monochrome by design — the icon carries the identity, not color.
 */
export function StageBadge({ stage, solid, className }: StageBadgeProps) {
  const meta = STAGE_META[stage]
  const Icon = meta.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 transition-colors",
        solid
          ? "bg-foreground text-background"
          : "border border-border bg-background text-foreground",
        className
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {PIPELINE_STAGE_LABEL[stage]}
    </span>
  )
}
