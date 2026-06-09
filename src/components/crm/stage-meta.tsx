import {
  Sparkles,
  ClipboardCheck,
  CalendarClock,
  FileText,
  Rocket,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import type { PipelineStage } from "@/lib/crm/store"

export interface StageMeta {
  icon: LucideIcon
  tagline: string
  /** Short label used in tight horizontal space (e.g. mobile stepper). */
  short: string
}

/**
 * Single source of truth for how each pipeline stage is presented.
 * Keeps icon/tagline choices consistent across tracker, badge and checklist.
 */
export const STAGE_META: Record<PipelineStage, StageMeta> = {
  lead: { icon: Sparkles, tagline: "Prospect identificado", short: "Lead" },
  qualified: { icon: ClipboardCheck, tagline: "Informações coletadas", short: "Qualif." },
  meeting: { icon: CalendarClock, tagline: "Conversa iniciada", short: "Reunião" },
  proposal: { icon: FileText, tagline: "Proposta enviada", short: "Proposta" },
  project: { icon: Rocket, tagline: "Projeto em andamento", short: "Projeto" },
  client: { icon: Trophy, tagline: "Negócio fechado", short: "Cliente" },
}
