import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { RecordEntry } from "@/lib/records/types"
import { ATUACOES } from "./atuacao-picker"
import { AREAS } from "./area-picker"
import { SCOPES } from "./impact-selector"

interface RecordCardProps {
  record: RecordEntry
  onClick?: () => void
}

export function RecordCard({ record, onClick }: RecordCardProps) {
  const atuacao = ATUACOES.find((a) => a.value === record.atuacao)
  const area = AREAS.find((a) => a.value === record.area)
  const scopeLabel = SCOPES.find((s) => s.value === record.impactScope)?.label

  const timeAgo = formatDistanceToNow(new Date(record.createdAt), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        onClick && "cursor-pointer hover:shadow-sm hover:border-foreground/20"
      )}
    >
      {/* Header: atuação badge + area label + impact dots */}
      <div className="flex items-center gap-2">
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
          <span className="text-[11px] text-muted-foreground">{area.label}</span>
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

      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug tracking-tight">
        {record.enriched.title}
      </h3>

      {/* Impact excerpt */}
      {record.enriched.impact && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {record.enriched.impact}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
        {scopeLabel && (
          <span className="ml-auto text-xs text-muted-foreground">
            {scopeLabel}
          </span>
        )}
      </div>
    </div>
  )
}
