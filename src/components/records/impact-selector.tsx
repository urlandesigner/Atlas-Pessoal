"use client"

import { UserIcon, Users2Icon, Building2Icon, GlobeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ImpactScope, ImpactLevel } from "@/lib/records/types"

export const SCOPES: { value: ImpactScope; label: string; icon: React.ElementType }[] = [
  { value: "personal", label: "Pessoal", icon: UserIcon },
  { value: "team", label: "Time", icon: Users2Icon },
  { value: "area", label: "Área", icon: Building2Icon },
  { value: "company", label: "Empresa", icon: GlobeIcon },
]

const LEVEL_CONFIG: Record<
  ImpactLevel,
  { label: string; description: string; selectedClass: string }
> = {
  1: {
    label: "Baixo",
    description: "Mudança local, pouco visível externamente",
    selectedClass: "border-slate-400 bg-slate-50 text-slate-700",
  },
  2: {
    label: "Médio",
    description: "Impacto perceptível, reconhecido pelo time",
    selectedClass: "border-blue-500 bg-blue-50 text-blue-700",
  },
  3: {
    label: "Alto",
    description: "Resultado expressivo e mensurável",
    selectedClass: "border-emerald-500 bg-emerald-50 text-emerald-700",
  },
  4: {
    label: "Estratégico",
    description: "Impacto organizacional, ampla visibilidade",
    selectedClass: "border-violet-500 bg-violet-50 text-violet-700",
  },
  5: {
    label: "Transformacional",
    description: "Mudança significativa na trajetória ou no produto",
    selectedClass: "border-orange-500 bg-orange-50 text-orange-700",
  },
}

const sectionLabel = "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60"

interface ImpactSelectorProps {
  scope: ImpactScope
  level: ImpactLevel
  onScopeChange: (scope: ImpactScope) => void
  onLevelChange: (level: ImpactLevel) => void
}

export function ImpactSelector({
  scope,
  level,
  onScopeChange,
  onLevelChange,
}: ImpactSelectorProps) {
  const levelConfig = LEVEL_CONFIG[level]

  return (
    <div className="flex flex-col gap-5">
      {/* Level */}
      <div className="flex flex-col gap-2">
        <span className={sectionLabel}>Nível de Impacto</span>
        <div className="flex flex-col gap-1">
          {([1, 2, 3, 4, 5] as ImpactLevel[]).map((l) => {
            const config = LEVEL_CONFIG[l]
            const selected = l === level
            return (
              <button
                key={l}
                type="button"
                onClick={() => onLevelChange(l)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-1.5 text-left text-xs font-medium transition-all",
                  selected
                    ? config.selectedClass
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "size-2 rounded-full shrink-0 transition-all",
                    selected ? "bg-current" : "border border-muted-foreground/40"
                  )}
                />
                {config.label}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {levelConfig.description}
        </p>
      </div>

      {/* Scope */}
      <div className="flex flex-col gap-2">
        <span className={sectionLabel}>Alcance</span>
        <div className="grid grid-cols-2 gap-1.5">
          {SCOPES.map((s) => {
            const Icon = s.icon
            const selected = scope === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onScopeChange(s.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border py-2 text-[11px] font-medium transition-all",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {s.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { type ImpactScope, type ImpactLevel }
