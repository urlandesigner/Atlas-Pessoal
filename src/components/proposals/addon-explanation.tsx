import type { ProposalAddonOptions } from "@/lib/proposals/store"
import { cn } from "@/lib/utils"

import {
  getProposalAddonNotes,
  hasProposalAddons,
  PROPOSAL_ADDON_FIRST_YEAR_FREE_NOTE,
  PROPOSAL_ADDON_INTRO,
} from "./addon-copy"
import { money } from "./utils"

export function ProposalAddonExplanation({
  included,
  addonOptions = {},
  className,
  variant = "app",
}: {
  included: string[]
  addonOptions?: ProposalAddonOptions
  className?: string
  variant?: "app" | "public"
}) {
  if (!hasProposalAddons(included)) return null

  const notes = getProposalAddonNotes(included, addonOptions)
  const isPublic = variant === "public"
  const hasFreeYear = notes.some((note) => note.firstYearFree)

  return (
    <div
      className={cn(
        isPublic
          ? "rounded-2xl border border-[var(--line)] bg-[var(--surface)]/40 p-6 sm:p-7"
          : "rounded-xl border bg-muted/20 p-4",
        className
      )}
    >
      <p
        className={cn(
          "text-sm leading-relaxed",
          isPublic ? "text-[var(--soft)]" : "text-muted-foreground"
        )}
      >
        {PROPOSAL_ADDON_INTRO}
      </p>
      {hasFreeYear ? (
        <p
          className={cn(
            "mt-3 text-sm leading-relaxed",
            isPublic ? "text-[var(--muted)]" : "text-muted-foreground"
          )}
        >
          {PROPOSAL_ADDON_FIRST_YEAR_FREE_NOTE}
        </p>
      ) : null}
      <div className={cn("mt-5 grid gap-4", notes.length > 1 && "sm:grid-cols-2")}>
        {notes.map((note) => (
          <div
            key={note.title}
            className={cn(
              "rounded-xl border p-4",
              isPublic ? "border-[var(--line)]" : "border-border/60 bg-background/80"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p
                className={cn(
                  "text-sm font-medium",
                  isPublic ? "text-[var(--foreground)]" : "text-foreground"
                )}
              >
                {note.title}
              </p>
              <span
                className={cn(
                  "shrink-0 font-mono text-[0.7rem] uppercase tracking-[0.18em]",
                  isPublic ? "text-[var(--accent-2)]" : "text-muted-foreground"
                )}
              >
                {note.firstYearFree ? "1º ano gratuito" : `${money(note.price)}/ano`}
              </span>
            </div>
            <p
              className={cn(
                "mt-2 text-sm leading-relaxed",
                isPublic ? "text-[var(--soft)]" : "text-muted-foreground"
              )}
            >
              {note.text}
            </p>
            {note.firstYearFree ? (
              <p
                className={cn(
                  "mt-2 text-xs leading-relaxed",
                  isPublic ? "text-[var(--muted)]" : "text-muted-foreground"
                )}
              >
                Renovação: {money(note.price)}/ano a partir do 2º ano.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
