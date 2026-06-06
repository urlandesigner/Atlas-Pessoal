"use client"

import { useState } from "react"
import { CheckIcon, PencilIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AIReviewFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function AIReviewField({ label, value, onChange }: AIReviewFieldProps) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="group flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <SparklesIcon className="size-3 text-violet-500 shrink-0" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        {!editing && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setEditing(true)}
          >
            <PencilIcon />
          </Button>
        )}
        {editing && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-emerald-600 hover:text-emerald-600"
            onClick={() => setEditing(false)}
          >
            <CheckIcon />
          </Button>
        )}
      </div>

      {editing ? (
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full resize-none rounded-lg border border-ring bg-transparent px-3 py-2 text-sm leading-relaxed outline-none ring-3 ring-ring/50 field-sizing-content min-h-[60px]"
          )}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false)
          }}
        />
      ) : (
        <p
          className="text-sm leading-relaxed text-foreground cursor-text rounded-lg px-1 py-0.5 -mx-1 hover:bg-muted/50 transition-colors"
          onClick={() => setEditing(true)}
        >
          {value || (
            <span className="text-muted-foreground italic">Não identificado</span>
          )}
        </p>
      )}
    </div>
  )
}
