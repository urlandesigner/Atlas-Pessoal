"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_LABEL,
  type PipelineStage,
} from "@/lib/crm/store"
import { STAGE_META } from "./stage-meta"

interface PipelineTrackerProps {
  current: PipelineStage
  /** Per-stage completion percentage (0–100), keyed by stage. */
  completionByStage?: Partial<Record<PipelineStage, number>>
  /** Invoked when a node is clicked. Parent decides whether to advance/regress. */
  onSelect?: (stage: PipelineStage) => void
  className?: string
}

/**
 * The "journey spine" — a precise, monochrome stepper that turns the
 * Lead → Cliente pipeline into the page's hero moment.
 */
export function PipelineTracker({
  current,
  completionByStage,
  onSelect,
  className,
}: PipelineTrackerProps) {
  const currentIndex = PIPELINE_STAGES.indexOf(current)

  return (
    <nav
      aria-label="Progresso da negociação"
      className={cn("animate-in fade-in duration-500", className)}
    >
      <ol className="flex items-start">
        {PIPELINE_STAGES.map((stage, index) => {
          const meta = STAGE_META[stage]
          const Icon = meta.icon
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex
          const connectorFilled = index <= currentIndex
          const pct = completionByStage?.[stage]

          const interactive = Boolean(onSelect)

          return (
            <li
              key={stage}
              className="relative flex flex-1 flex-col items-center gap-2.5 animate-in fade-in slide-in-from-bottom-1"
              style={{ animationDelay: `${index * 70}ms`, animationFillMode: "backwards" }}
            >
              {/* Node row — fixed height so connectors align to node center */}
              <div className="relative flex h-10 w-full items-center justify-center">
                {/* Connector to the previous node */}
                {index > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-1/2 top-1/2 h-px w-full -translate-y-1/2 transition-colors duration-500",
                      connectorFilled ? "bg-foreground" : "bg-border"
                    )}
                  />
                )}

                <button
                  type="button"
                  disabled={!interactive}
                  onClick={() => onSelect?.(stage)}
                  aria-current={isCurrent ? "step" : undefined}
                  title={`${PIPELINE_STAGE_LABEL[stage]} — ${meta.tagline}`}
                  className={cn(
                    "relative z-10 flex size-10 items-center justify-center rounded-full transition-all duration-300",
                    interactive && "cursor-pointer",
                    isDone && "bg-foreground text-background",
                    isCurrent &&
                      "bg-foreground text-background shadow-md ring-4 ring-foreground/10",
                    isUpcoming &&
                      "border border-border bg-background text-muted-foreground/50",
                    interactive && isUpcoming && "hover:border-foreground/40 hover:text-foreground/70",
                    interactive && !isUpcoming && "hover:scale-105"
                  )}
                >
                  {isDone ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <Icon className="size-[18px]" strokeWidth={isCurrent ? 2.25 : 1.75} />
                  )}

                  {/* Soft pulse ring on the active node */}
                  {isCurrent && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full ring-1 ring-foreground/20 animate-ping [animation-duration:2.5s]"
                    />
                  )}
                </button>
              </div>

              {/* Label */}
              <div className="flex flex-col items-center gap-0.5 px-1 text-center">
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase leading-none tracking-wider transition-colors sm:text-[11px]",
                    isCurrent && "text-foreground",
                    isDone && "text-foreground/60",
                    isUpcoming && "text-muted-foreground/50"
                  )}
                >
                  <span className="hidden sm:inline">{PIPELINE_STAGE_LABEL[stage]}</span>
                  <span className="sm:hidden">{meta.short}</span>
                </span>

                {/* Completion % only on the active stage */}
                {isCurrent && typeof pct === "number" && (
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {pct}%
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
