"use client"

import {
  Users2Icon,
  PackageIcon,
  BriefcaseIcon,
  LayersIcon,
  BookOpenIcon,
  ZapIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AtuacaoType } from "@/lib/records/types"

export const ATUACOES: {
  value: AtuacaoType
  label: string
  icon: React.ElementType
  baseClass: string
  selectedClass: string
}[] = [
  {
    value: "liderança",
    label: "Liderança",
    icon: Users2Icon,
    baseClass: "text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100",
    selectedClass: "bg-purple-600 text-white border-purple-600",
  },
  {
    value: "execução",
    label: "Execução",
    icon: PackageIcon,
    baseClass: "text-orange-600 border-orange-200 bg-orange-50 hover:bg-orange-100",
    selectedClass: "bg-orange-600 text-white border-orange-600",
  },
  {
    value: "estratégia",
    label: "Estratégia",
    icon: BriefcaseIcon,
    baseClass: "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100",
    selectedClass: "bg-blue-600 text-white border-blue-600",
  },
  {
    value: "arquitetura",
    label: "Arquitetura",
    icon: LayersIcon,
    baseClass: "text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100",
    selectedClass: "bg-amber-600 text-white border-amber-600",
  },
  {
    value: "mentoria",
    label: "Mentoria",
    icon: BookOpenIcon,
    baseClass: "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
    selectedClass: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    value: "inovação",
    label: "Inovação",
    icon: ZapIcon,
    baseClass: "text-violet-600 border-violet-200 bg-violet-50 hover:bg-violet-100",
    selectedClass: "bg-violet-600 text-white border-violet-600",
  },
]

interface AtuacaoPickerProps {
  value: AtuacaoType
  onChange: (value: AtuacaoType) => void
}

export function AtuacaoPicker({ value, onChange }: AtuacaoPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ATUACOES.map((a) => {
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
