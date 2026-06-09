import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  /** Main page title. */
  title: ReactNode
  /** Optional supporting line below the title. */
  description?: ReactNode
  /**
   * Optional small overline above the title (e.g. a section tag/badge).
   * Pass a string for the default pill, or a node for full control.
   */
  eyebrow?: ReactNode
  /** Right-aligned actions, usually a primary button. */
  actions?: ReactNode
  className?: string
}

/**
 * Standardized page header used across the app.
 * Layout: eyebrow (optional) + title + description on the left, actions on the right.
 * Stacks vertically on mobile, sits side-by-side from `sm` up.
 */
export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          typeof eyebrow === "string" ? (
            <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrow}
            </span>
          ) : (
            eyebrow
          )
        ) : null}

        <h1
          className={cn(
            "truncate text-2xl font-semibold tracking-tight",
            eyebrow && "mt-3"
          )}
        >
          {title}
        </h1>

        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
