"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  CLIENT_STATUS_LABEL,
  PLAN_LABEL,
  type PostSaleClientForm,
} from "@/lib/clients/store"

import { planOptions, statusOptions } from "./constants"

export function ClientFormSheet({
  open,
  mode,
  initialForm,
  onClose,
  onSubmit,
}: {
  open: boolean
  mode: "create" | "edit"
  initialForm: PostSaleClientForm
  onClose: () => void
  onSubmit: (form: PostSaleClientForm) => void
}) {
  const [form, setForm] = useState(initialForm)

  function set(field: keyof PostSaleClientForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function close() {
    setForm(initialForm)
    onClose()
  }

  function submit() {
    if (!form.name.trim()) return
    onSubmit(form)
    setForm(initialForm)
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && close()}>
      <SheetContent className="flex flex-col gap-0 p-0 data-[side=right]:w-full sm:data-[side=right]:w-[42rem] sm:data-[side=right]:max-w-[42rem]" side="right">
        <SheetHeader className="border-b px-5 pb-4 pt-5 pr-12">
          <SheetTitle className="text-base">{mode === "create" ? "Novo cliente" : "Editar cliente"}</SheetTitle>
          <p className="text-xs text-muted-foreground">Dados principais do relacionamento, projeto, garantia e plano.</p>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="grid gap-5 p-5">
            <FormBlock title="Resumo">
              <Field label="Nome *"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
              <Field label="Empresa"><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></Field>
              <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
              <Field label="E-mail"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Status">
                <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                  {statusOptions.map((status) => <option key={status} value={status}>{CLIENT_STATUS_LABEL[status]}</option>)}
                </select>
              </Field>
            </FormBlock>
            <FormBlock title="Projeto atual">
              <Field label="Projeto contratado"><Input value={form.projectName} onChange={(e) => set("projectName", e.target.value)} /></Field>
              <Field label="Tipo"><Input value={form.projectType} onChange={(e) => set("projectType", e.target.value)} /></Field>
              <Field label="Inicio"><Input type="date" value={form.projectStartDate} onChange={(e) => set("projectStartDate", e.target.value)} /></Field>
              <Field label="Entrega"><Input type="date" value={form.projectDeliveryDate} onChange={(e) => set("projectDeliveryDate", e.target.value)} /></Field>
              <Field label="Valor contratado"><Input type="number" value={form.contractedValue} onChange={(e) => set("contractedValue", e.target.value)} /></Field>
              <Field label="Site publicado"><Input value={form.publishedSiteUrl} onChange={(e) => set("publishedSiteUrl", e.target.value)} /></Field>
            </FormBlock>
            <FormBlock title="Plano e garantia">
              <Field label="Plano atual">
                <select className="h-10 rounded-md border border-input bg-transparent px-3 text-sm" value={form.plan} onChange={(e) => set("plan", e.target.value)}>
                  {planOptions.map((plan) => <option key={plan} value={plan}>{PLAN_LABEL[plan]}</option>)}
                </select>
              </Field>
              <Field label="Data de contratacao"><Input type="date" value={form.planStartedAt} onChange={(e) => set("planStartedAt", e.target.value)} /></Field>
              <Field label="Valor mensal"><Input type="number" value={form.monthlyValue} onChange={(e) => set("monthlyValue", e.target.value)} /></Field>
              <Field label="Data da entrega"><Input type="date" value={form.warrantyDeliveryDate} onChange={(e) => set("warrantyDeliveryDate", e.target.value)} /></Field>
              <Field label="Dias de garantia"><Input type="number" value={form.warrantyDays} onChange={(e) => set("warrantyDays", e.target.value)} /></Field>
            </FormBlock>
          </div>
        </ScrollArea>
        <SheetFooter className="flex flex-row gap-2 border-t px-5 py-4">
          <Button variant="ghost" className="flex-1" onClick={close}>Cancelar</Button>
          <Button className="flex-1" onClick={submit} disabled={!form.name.trim()}>Salvar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">{label}{children}</label>
}

function FormBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="grid gap-3 rounded-lg border bg-muted/10 p-4"><h3 className="text-sm font-semibold text-foreground">{title}</h3><div className="grid gap-3 sm:grid-cols-2">{children}</div></section>
}
