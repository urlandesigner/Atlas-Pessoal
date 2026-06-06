"use client"

import { useState, useEffect, useRef } from "react"
import {
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon,
  SaveIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AIReviewField } from "./ai-review-field"
import { AtuacaoPicker, ATUACOES } from "./atuacao-picker"
import { AreaPicker } from "./area-picker"
import { ImpactSelector } from "./impact-selector"
import type {
  RecordEntry,
  EnrichedFields,
  AtuacaoType,
  AreaType,
  ImpactScope,
  ImpactLevel,
} from "@/lib/records/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "input" | "processing" | "review"

type Detection = {
  atuacao: AtuacaoType
  area: AreaType
  scope: ImpactScope
  tags: string[]
}

type Signal = { icon: string; label: string; colorClass: string }

type ScoreResult = {
  label: string
  description: string
  colorClass: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROCESSING_STEPS = [
  "Analisando contexto...",
  "Identificando sua contribuição...",
  "Estruturando a narrativa...",
  "Extraindo aprendizados...",
  "Avaliando alcance e impacto...",
  "Finalizando registro...",
]

const FIELD_LABELS: Record<keyof EnrichedFields, string> = {
  title: "Título",
  context: "Contexto",
  objective: "Objetivo",
  contribution: "Contribuição",
  decisions: "Decisões",
  impact: "Impacto",
  learnings: "Aprendizados",
}

const FIELD_ORDER: (keyof EnrichedFields)[] = [
  "title",
  "context",
  "objective",
  "contribution",
  "decisions",
  "impact",
  "learnings",
]

// ─── Intelligence helpers ─────────────────────────────────────────────────────

function computeSignals(
  enriched: EnrichedFields,
  atuacao: AtuacaoType,
  scope: ImpactScope
): Signal[] {
  const signals: Signal[] = []
  const text = Object.values(enriched).join(" ").toLowerCase()

  if (atuacao === "liderança" || /conduzi|alinhei|facilitei|liderança/.test(text)) {
    signals.push({
      icon: "👥",
      label: "Liderança identificada",
      colorClass: "text-purple-700 bg-purple-50 border-purple-200",
    })
  }

  if (scope === "area" || scope === "company") {
    signals.push({
      icon: "🎯",
      label: "Impacto transversal",
      colorClass: "text-blue-700 bg-blue-50 border-blue-200",
    })
  }

  if (atuacao === "arquitetura" || /arquitetura|estrutura técnica|microsservi/.test(text)) {
    signals.push({
      icon: "⚡",
      label: "Decisão arquitetural",
      colorClass: "text-amber-700 bg-amber-50 border-amber-200",
    })
  }

  if (/design.?system|sistema de design/.test(text)) {
    signals.push({
      icon: "🧩",
      label: "Design System detectado",
      colorClass: "text-violet-700 bg-violet-50 border-violet-200",
    })
  }

  if (/\d+%|reduz|aument|melhor|cresceu|aceler/.test(text)) {
    signals.push({
      icon: "📈",
      label: "Impacto mensurável",
      colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    })
  }

  return signals.slice(0, 3)
}

function computeScore(
  level: ImpactLevel,
  scope: ImpactScope,
  atuacao: AtuacaoType
): ScoreResult {
  const levelPts = level * 2
  const scopePts: Record<ImpactScope, number> = {
    personal: 0,
    team: 2,
    area: 4,
    company: 6,
  }
  const atuacaoPts: Record<AtuacaoType, number> = {
    "liderança": 4,
    "estratégia": 4,
    "arquitetura": 3,
    "inovação": 3,
    "mentoria": 2,
    "execução": 1,
  }
  const total = levelPts + scopePts[scope] + atuacaoPts[atuacao]

  if (total >= 16)
    return {
      label: "Alta relevância estratégica",
      description: "Forte evidência para promoção ou performance review",
      colorClass: "text-violet-700 bg-violet-50 border-violet-200",
    }
  if (total >= 11)
    return {
      label: "Contribuição estratégica",
      description: "Impacto bem documentado, boa visibilidade organizacional",
      colorClass: "text-blue-700 bg-blue-50 border-blue-200",
    }
  if (total >= 7)
    return {
      label: "Impacto sólido",
      description: "Registro consistente da sua atuação profissional",
      colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    }
  return {
    label: "Contribuição registrada",
    description: "Boa base para evolução e documentação de trajetória",
    colorClass: "text-muted-foreground bg-muted border-border",
  }
}

// ─── Client-side detection ────────────────────────────────────────────────────

function detectLocal(text: string): Detection {
  const lower = text.toLowerCase()

  // Tipo de atuação
  let atuacao: AtuacaoType = "execução"
  if (/lider|decidi|conduzi|alinhei|facilitei|stakeholder|negoci/.test(lower)) {
    atuacao = "liderança"
  } else if (/arquitet|plataforma|estrutura técnica|módulo de/.test(lower)) {
    atuacao = "arquitetura"
  } else if (/estratég|direção|roadmap|prioridad|propus a|defini a/.test(lower)) {
    atuacao = "estratégia"
  } else if (/mentorei|guiei|capacitei|desenvolvi o time|apoiei o/.test(lower)) {
    atuacao = "mentoria"
  } else if (/inova|experiment|poc|hipótese|teste a\/b/.test(lower)) {
    atuacao = "inovação"
  }

  // Área
  let area: AreaType = "produto"
  if (/design.?system|sistema de design|token|design token/.test(lower)) {
    area = "design-system"
  } else if (/\bux\b|experiência do usuário|jornada|wireframe|prototip/.test(lower)) {
    area = "ux"
  } else if (/backend|frontend|\bapi\b|banco de dados|infraestrutura|deploy|typescript|react/.test(lower)) {
    area = "engenharia"
  } else if (/processo|fluxo operacional|ritual|cerimônia|metodologia/.test(lower)) {
    area = "processo"
  } else if (/cultura|clima|engajamento|onboard|bem-estar/.test(lower)) {
    area = "cultura"
  } else if (/financeiro|receita|custo|orçamento|relatório/.test(lower)) {
    area = "operacional"
  }

  // Scope
  let scope: ImpactScope = "team"
  if (/empresa|organização|todos os times|global|c-level|board|diretoria/.test(lower)) {
    scope = "company"
  } else if (/área|departamento|múltiplos times|cross-funcional|entre times/.test(lower)) {
    scope = "area"
  } else if (/pessoal|meu aprendizado|eu mesmo/.test(lower)) {
    scope = "personal"
  }

  // Tags
  const tagMap: [RegExp, string][] = [
    [/design.?system/i, "design-system"],
    [/\bux\b|experiência do usuário/i, "ux"],
    [/\bproduto\b/i, "produto"],
    [/arquitetura|microsservi/i, "arquitetura"],
    [/\bapi\b|backend|frontend/i, "engenharia"],
    [/\bprocesso\b|\bfluxo\b/i, "processo"],
    [/liderança|lideranç/i, "liderança"],
    [/dados|analytics|métricas/i, "dados"],
    [/performance|velocidade/i, "performance"],
  ]

  const tags = tagMap
    .filter(([regex]) => regex.test(text))
    .map(([, tag]) => tag)
    .slice(0, 3)

  return { atuacao, area, scope, tags }
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface QuickCaptureProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (record: RecordEntry) => void
}

export function QuickCapture({ open, onOpenChange, onSave }: QuickCaptureProps) {
  const [step, setStep] = useState<Step>("input")
  const [raw, setRaw] = useState("")
  const [enriched, setEnriched] = useState<EnrichedFields | null>(null)
  const [atuacao, setAtuacao] = useState<AtuacaoType>("execução")
  const [area, setArea] = useState<AreaType>("produto")
  const [impactScope, setImpactScope] = useState<ImpactScope>("team")
  const [impactLevel, setImpactLevel] = useState<ImpactLevel>(3)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [error, setError] = useState(false)
  const [detection, setDetection] = useState<Detection | null>(null)
  const [detecting, setDetecting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset on dialog close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("input")
        setRaw("")
        setEnriched(null)
        setVisibleSteps(0)
        setError(false)
        setDetection(null)
        setDetecting(false)
        setAtuacao("execução")
        setArea("produto")
        setImpactScope("team")
        setImpactLevel(3)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // Auto-focus on open
  useEffect(() => {
    if (open && step === "input") {
      const t = setTimeout(() => textareaRef.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open, step])

  // Live detection — debounced, client-side
  useEffect(() => {
    if (raw.trim().length < 60) {
      setDetection(null)
      setDetecting(false)
      return
    }
    setDetecting(true)
    const t = setTimeout(() => {
      setDetection(detectLocal(raw))
      setDetecting(false)
    }, 700)
    return () => clearTimeout(t)
  }, [raw])

  async function handleAnalyze() {
    if (!raw.trim() || raw.trim().length < 20) return

    // Pre-populate metadata from live detection
    if (detection) {
      setAtuacao(detection.atuacao)
      setArea(detection.area)
      setImpactScope(detection.scope)
    }

    setStep("processing")
    setVisibleSteps(0)
    setError(false)

    let count = 0
    intervalRef.current = setInterval(() => {
      count++
      setVisibleSteps(count)
      if (count >= PROCESSING_STEPS.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, 550)

    try {
      const res = await fetch("/api/records/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      })

      if (!res.ok) throw new Error("API error")

      const data = await res.json()

      const remaining = (PROCESSING_STEPS.length - count) * 550 + 400
      await new Promise((r) => setTimeout(r, Math.max(remaining, 400)))

      if (intervalRef.current) clearInterval(intervalRef.current)
      setVisibleSteps(PROCESSING_STEPS.length)
      setEnriched(data.enriched)
      setStep("review")
    } catch {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setError(true)
      setStep("input")
    }
  }

  function handleSave() {
    if (!enriched) return
    const record: RecordEntry = {
      id: crypto.randomUUID(),
      raw,
      enriched,
      atuacao,
      area,
      impactScope,
      impactLevel,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    onSave(record)
  }

  function updateField(key: keyof EnrichedFields, value: string) {
    setEnriched((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={step !== "processing"}
        className="sm:max-w-3xl p-0 gap-0 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {step === "input" && (
          <InputStep
            raw={raw}
            setRaw={setRaw}
            textareaRef={textareaRef}
            onAnalyze={handleAnalyze}
            error={error}
            detection={detection}
            detecting={detecting}
          />
        )}
        {step === "processing" && (
          <ProcessingStep visibleSteps={visibleSteps} />
        )}
        {step === "review" && enriched && (
          <ReviewStep
            enriched={enriched}
            raw={raw}
            atuacao={atuacao}
            area={area}
            impactScope={impactScope}
            impactLevel={impactLevel}
            onFieldChange={updateField}
            onAtuacaoChange={setAtuacao}
            onAreaChange={setArea}
            onScopeChange={setImpactScope}
            onLevelChange={setImpactLevel}
            onSave={handleSave}
            onBack={() => setStep("input")}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Step: Input ──────────────────────────────────────────────────────────────

function InputStep({
  raw,
  setRaw,
  textareaRef,
  onAnalyze,
  error,
  detection,
  detecting,
}: {
  raw: string
  setRaw: (v: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onAnalyze: () => void
  error: boolean
  detection: Detection | null
  detecting: boolean
}) {
  const canAnalyze = raw.trim().length >= 20
  const showDetection = raw.trim().length >= 60 && (!!detection || detecting)
  const atuacaoInfo = detection
    ? ATUACOES.find((a) => a.value === detection.atuacao)
    : null

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b px-5 py-4 bg-gradient-to-b from-violet-50/30 to-transparent">
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100">
          <SparklesIcon className="size-4 text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-semibold">Novo Registro</p>
          <p className="text-xs text-muted-foreground">
            Registre decisões, impactos e conquistas — a IA estrutura sua trajetória.
          </p>
        </div>
      </div>

      {/* Textarea */}
      <div className="px-5 py-4">
        <textarea
          ref={textareaRef}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              onAnalyze()
            }
          }}
          placeholder="Conduzi as decisões técnicas do novo módulo de checkout junto ao time de produto e engenharia. Alinhamos prioridades com stakeholders, eliminamos débito crítico no fluxo e entregamos 2 semanas antes — o que reduziu chamados de suporte em 35% no primeiro mês."
          className={cn(
            "w-full resize-none rounded-xl border border-transparent bg-muted/40 px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-ring/30 focus:bg-background focus:ring-3 focus:ring-ring/20",
            "field-sizing-content min-h-[160px]"
          )}
        />

        {/* Live detection strip */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            showDetection ? "max-h-10 opacity-100 mt-2.5" : "max-h-0 opacity-0 mt-0"
          )}
        >
          {detecting ? (
            <div className="flex items-center gap-1.5">
              <Loader2Icon className="size-3 text-violet-400 animate-spin" />
              <span className="text-[11px] text-muted-foreground">Interpretando...</span>
            </div>
          ) : atuacaoInfo ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full border",
                  atuacaoInfo.baseClass
                )}
              >
                {atuacaoInfo.label}
              </span>
              {detection!.tags.length > 0 && (
                <>
                  <span className="text-muted-foreground/40 text-[11px]">·</span>
                  {detection!.tags.map((tag) => (
                    <span key={tag} className="text-[11px] text-muted-foreground/60">
                      #{tag}
                    </span>
                  ))}
                </>
              )}
            </div>
          ) : null}
        </div>

        {error && (
          <p className="mt-2 text-xs text-destructive">
            Erro ao processar. Tente novamente.
          </p>
        )}
      </div>

      {/* Examples */}
      <div className="px-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
          Inspiração
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[
            "Decidi arquitetura com trade-offs claros",
            "Alinhou produto e eng em mudança de rota",
            "Reestruturei processo entre squads",
            "Entrega que moveu métricas de negócio",
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => { if (!raw) setRaw(ex) }}
              className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t px-5 py-3">
        <p className="text-xs text-muted-foreground">
          <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono bg-muted">⌘↵</kbd>
          {" para estruturar"}
        </p>
        <Button onClick={onAnalyze} disabled={!canAnalyze} size="sm" className="gap-1.5">
          <SparklesIcon className="size-3.5" />
          Estruturar com IA
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step: Processing ─────────────────────────────────────────────────────────

function ProcessingStep({ visibleSteps }: { visibleSteps: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-8 py-12">
      <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100">
        <Loader2Icon className="size-6 text-violet-600 animate-spin" />
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold">Estruturando seu registro...</p>
        <p className="text-xs text-muted-foreground mt-1">
          Organizando decisões, impacto e contexto profissional
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2">
        {PROCESSING_STEPS.map((label, i) => {
          const done = i < visibleSteps - 1
          const active = i === visibleSteps - 1
          const hidden = i >= visibleSteps

          return (
            <div
              key={label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-300",
                hidden && "opacity-0",
                active && "opacity-100",
                done && "opacity-50"
              )}
            >
              <div className="shrink-0">
                {done ? (
                  <CheckIcon className="size-4 text-emerald-500" />
                ) : active ? (
                  <Loader2Icon className="size-4 text-violet-500 animate-spin" />
                ) : (
                  <div className="size-4 rounded-full border-2 border-muted" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  done && "text-muted-foreground",
                  active && "font-medium text-foreground",
                  hidden && "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step: Review ─────────────────────────────────────────────────────────────

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </span>
  )
}

function ReviewStep({
  enriched,
  raw,
  atuacao,
  area,
  impactScope,
  impactLevel,
  onFieldChange,
  onAtuacaoChange,
  onAreaChange,
  onScopeChange,
  onLevelChange,
  onSave,
  onBack,
}: {
  enriched: EnrichedFields
  raw: string
  atuacao: AtuacaoType
  area: AreaType
  impactScope: ImpactScope
  impactLevel: ImpactLevel
  onFieldChange: (key: keyof EnrichedFields, value: string) => void
  onAtuacaoChange: (v: AtuacaoType) => void
  onAreaChange: (v: AreaType) => void
  onScopeChange: (v: ImpactScope) => void
  onLevelChange: (v: ImpactLevel) => void
  onSave: () => void
  onBack: () => void
}) {
  const [showRaw, setShowRaw] = useState(false)
  const signals = computeSignals(enriched, atuacao, impactScope)
  const score = computeScore(impactLevel, impactScope, atuacao)

  return (
    <>
      {/* Fixed header */}
      <div className="flex items-center gap-2 border-b px-5 py-3 shrink-0">
        <Button variant="ghost" size="icon-sm" onClick={onBack}>
          <ChevronLeftIcon />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded bg-emerald-100">
            <CheckIcon className="size-3 text-emerald-600" />
          </div>
          <p className="text-sm font-semibold">Seu registro estruturado</p>
        </div>
        <p className="ml-auto text-xs text-muted-foreground">
          Clique em qualquer campo para editar
        </p>
      </div>

      {/* Two-column body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* ── Left: AI content ── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="flex flex-col gap-5 px-5 py-5">
            {FIELD_ORDER.map((key) => (
              <AIReviewField
                key={key}
                label={FIELD_LABELS[key]}
                value={enriched[key]}
                onChange={(v) => onFieldChange(key, v)}
              />
            ))}
          </div>

          {/* Before/after toggle */}
          <div className="px-5 pb-6">
            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRightIcon
                className={cn(
                  "size-3 transition-transform duration-200",
                  showRaw && "rotate-90"
                )}
              />
              Ver entrada original
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                showRaw ? "max-h-48 opacity-100 mt-2.5" : "max-h-0 opacity-0"
              )}
            >
              <div className="rounded-lg border bg-muted/30 px-4 py-3 font-mono text-xs text-muted-foreground leading-relaxed">
                {raw}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="w-[248px] shrink-0 border-l overflow-y-auto">
          <div className="flex flex-col gap-5 px-4 py-4">

            {/* Intelligence signals */}
            {signals.length > 0 && (
              <div className="flex flex-col gap-2">
                <SidebarLabel>Inteligência</SidebarLabel>
                <div className="flex flex-col gap-1.5">
                  {signals.map((sig) => (
                    <div
                      key={sig.label}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5",
                        sig.colorClass
                      )}
                    >
                      <span className="text-sm leading-none">{sig.icon}</span>
                      <span className="text-[11px] font-medium">{sig.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Atuação */}
            <div className="flex flex-col gap-2">
              <SidebarLabel>Tipo de Atuação</SidebarLabel>
              <AtuacaoPicker value={atuacao} onChange={onAtuacaoChange} />
            </div>

            {/* Área */}
            <div className="flex flex-col gap-2">
              <SidebarLabel>Área</SidebarLabel>
              <AreaPicker value={area} onChange={onAreaChange} />
            </div>

            {/* Impact + scope */}
            <ImpactSelector
              scope={impactScope}
              level={impactLevel}
              onScopeChange={onScopeChange}
              onLevelChange={onLevelChange}
            />

            {/* Visibility score */}
            <div className="flex flex-col gap-2">
              <SidebarLabel>Relevância Profissional</SidebarLabel>
              <div className={cn("rounded-lg border px-3 py-2.5", score.colorClass)}>
                <p className="text-[11px] font-semibold leading-snug">{score.label}</p>
                <p className="text-[10px] opacity-75 mt-0.5 leading-snug">{score.description}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <div className="border-t px-5 py-3 shrink-0 bg-muted/30">
        <Button onClick={onSave} className="w-full gap-2">
          <SaveIcon className="size-4" />
          Salvar Registro
        </Button>
      </div>
    </>
  )
}
