"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Check, Plus, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createScopeCategory, type ProposalScopeCategory } from "@/lib/proposals/store"
import { cn } from "@/lib/utils"

import { money } from "./utils"

export function EditableList({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  const [draft, setDraft] = useState("")

  function add() {
    if (!draft.trim()) return
    onChange([...items, draft.trim()])
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              add()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus data-icon="inline-start" />
          Adicionar
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Input
              value={item}
              onChange={(event) => {
                const next = [...items]
                next[index] = event.target.value
                onChange(next)
              }}
              className="border-0 px-0 shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            >
              <X />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ScopeEditor({
  scope,
  onChange,
}: {
  scope: ProposalScopeCategory[]
  onChange: (scope: ProposalScopeCategory[]) => void
}) {
  function updateCategory(index: number, updates: Partial<ProposalScopeCategory>) {
    onChange(scope.map((category, itemIndex) => (itemIndex === index ? { ...category, ...updates } : category)))
  }

  function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= scope.length) return
    const next = [...scope]
    const current = next[index]
    next[index] = next[target]
    next[target] = current
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-muted-foreground">Escopo em categorias</label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...scope, createScopeCategory()])}>
          <Plus data-icon="inline-start" />
          Categoria
        </Button>
      </div>

      {scope.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-6 text-base text-muted-foreground">
          Adicione categorias como Estrutura do Site, Funcionalidades ou Entregas.
        </div>
      ) : (
        scope.map((category, categoryIndex) => (
          <div key={category.id} className="rounded-xl border bg-background p-3">
            <div className="flex items-center gap-2">
              <Input
                value={category.name}
                onChange={(event) => updateCategory(categoryIndex, { name: event.target.value })}
                placeholder="Nome da categoria"
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveCategory(categoryIndex, -1)}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => moveCategory(categoryIndex, 1)}>
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(scope.filter((_, index) => index !== categoryIndex))}
              >
                <Trash2 />
              </Button>
            </div>
            <EditableList
              label="Itens"
              items={category.items}
              placeholder="Ex: Home"
              onChange={(items) => updateCategory(categoryIndex, { items })}
            />
          </div>
        ))
      )}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-base font-medium">{title}</h3>
      {children}
    </section>
  )
}

export function AddonToggle({
  label,
  detail,
  price,
  firstYearFree = false,
  checked,
  onToggle,
}: {
  label: string
  detail: string
  price?: number
  firstYearFree?: boolean
  checked: boolean
  onToggle: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
        checked ? "border-foreground/20 bg-muted/40" : "hover:bg-muted/20"
      )}
    >
      <div
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded border-2 transition-colors",
          checked ? "border-foreground bg-foreground text-background" : "border-input"
        )}
      >
        {checked && <Check className="size-3" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {typeof price === "number" ? (
        <span className={cn("shrink-0 text-sm font-medium tabular-nums", checked ? "text-foreground" : "text-muted-foreground")}>
          {firstYearFree ? "1º ano gratuito" : `+ ${money(price)}/ano`}
        </span>
      ) : null}
    </button>
  )
}

export function FirstYearFreeOption({
  checked,
  onToggle,
}: {
  checked: boolean
  onToggle: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        "ml-7 flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        checked ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
          checked ? "border-foreground bg-foreground text-background" : "border-input"
        )}
      >
        {checked && <Check className="size-2.5" />}
      </div>
      Oferecer 1º ano gratuito
    </button>
  )
}
