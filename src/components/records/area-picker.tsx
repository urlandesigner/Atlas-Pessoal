"use client"

import {
  BoxIcon,
  MonitorIcon,
  LayoutGridIcon,
  CodeIcon,
  CogIcon,
  HeartIcon,
  BarChart2Icon,
  TagIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AreaType } from "@/lib/records/types"

export const AREAS: {
  value: AreaType
  label: string
  icon: React.ElementType
  baseClass: string
  selectedClass: string
}[] = [
  {
    value: "produto",
    label: "Produto",
    icon: BoxIcon,
    baseClass: "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100",
    selectedClass: "bg-blue-600 text-white border-blue-600",
  },
  {
    value: "ux",
    label: "UX / Design",
    icon: MonitorIcon,
    baseClass: "text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100",
    selectedClass: "bg-rose-600 text-white border-rose-600",
  },
  {
    value: "design-system",
    label: "Design System",
    icon: LayoutGridIcon,
    baseClass: "text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100",
    selectedClass: "bg-violet-600 text-white border-violet-600",
  },
  {
    value: "engenharia",
    label: "Engenharia",
    icon: CodeIcon,
    baseClass: "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100",
    selectedClass: "bg-amber-600 text-white border-amber-600",
  },
  {
    value: "processo",
    label: "Processo",
    icon: CogIcon,
    baseClass: "text-muted-foreground border-border bg-muted hover:bg-muted/70",
    selectedClass: "bg-foreground text-background border-foreground",
  },
  {
    value: "cultura",
    label: "Cultura",
    icon: HeartIcon,
    baseClass: "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
    selectedClass: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    value: "operacional",
    label: "Operacional",
    icon: BarChart2Icon,
    baseClass: "text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100",
    selectedClass: "bg-orange-600 text-white border-orange-600",
  },
  {
    value: "outros",
    label: "Outros",
    icon: TagIcon,
    baseClass: "text-muted-foreground border-border bg-muted hover:bg-muted/70",
    selectedClass: "bg-foreground text-background border-foreground",
  },
]

interface AreaPickerProps {
  value: AreaType
  onChange: (value: AreaType) => void
}

export function AreaPicker({ value, onChange }: AreaPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {AREAS.map((a) => {
        const Icon = a.icon
        const selected = value === a.value
        return (
          <button
            key={a.value}
            type="button"
            onClick={() => onChange(a.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
              selected ? a.selectedClass : a.baseClass
            )}
          >
            <Icon className="size-3" />
            {a.label}
          </button>
        )
      })}
    </div>
  )
}
