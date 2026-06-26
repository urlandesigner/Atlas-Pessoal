"use client"

import {
  generateSiteProject,
  SITE_FACTORY_TEMPLATES,
  validateBriefing,
  type SiteFactoryBriefing,
  type SiteFactoryValidationIssue,
} from "@atlas/site-factory"
import { useMemo, useState } from "react"

import {
  EMPTY_SITE_FACTORY_FORM,
  type SiteFactoryProjectFormState,
  type SiteFactoryProjectRecord,
} from "@/components/site-factory/site-factory-types"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

function toList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildBriefingFromForm(form: SiteFactoryProjectFormState): Partial<SiteFactoryBriefing> {
  return {
    projectName: form.projectName,
    templateId: form.templateId,
    businessName: form.businessName,
    businessSegment: form.businessSegment,
    summary: form.summary,
    targetAudience: form.targetAudience,
    goals: toList(form.goals),
    offerings: toList(form.offerings),
    differentiators: toList(form.differentiators),
    toneAttributes: toList(form.toneAttributes),
    requiredSections: toList(form.requiredSections),
    references: toList(form.references),
    seoKeywords: toList(form.seoKeywords),
    callToAction: form.callToAction,
    location: form.location || undefined,
    constraints: toList(form.constraints),
    notes: form.notes || undefined,
    contact: {
      email: form.contactEmail || undefined,
      phone: form.contactPhone || undefined,
      whatsapp: form.contactWhatsapp || undefined,
      instagram: form.contactInstagram || undefined,
      website: form.contactWebsite || undefined,
      address: form.contactAddress || undefined,
    },
  }
}

function Field({
  label,
  helper,
  children,
}: {
  label: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  )
}

export function SiteFactoryEditor({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (project: SiteFactoryProjectRecord) => void
}) {
  const [form, setForm] = useState<SiteFactoryProjectFormState>(EMPTY_SITE_FACTORY_FORM)
  const [errors, setErrors] = useState<SiteFactoryValidationIssue[]>([])

  const activeTemplate = useMemo(
    () => SITE_FACTORY_TEMPLATES.find((template) => template.id === form.templateId),
    [form.templateId]
  )

  function set<K extends keyof SiteFactoryProjectFormState>(
    field: K,
    value: SiteFactoryProjectFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleClose() {
    setForm(EMPTY_SITE_FACTORY_FORM)
    setErrors([])
    onClose()
  }

  function handleSubmit() {
    const input = buildBriefingFromForm(form)
    const validation = validateBriefing(input)
    setErrors(validation.errors)
    if (!validation.valid) return

    const result = generateSiteProject(input)
    if (!result.ok || !result.briefing || !result.template) {
      setErrors(result.errors)
      return
    }

    const now = new Date().toISOString()
    onSubmit({
      id: `site-factory-${Date.now()}`,
      name: result.briefing.projectName,
      templateId: result.template.id,
      businessName: result.briefing.businessName,
      summary: result.briefing.summary,
      createdAt: now,
      updatedAt: now,
      briefing: result.briefing,
      files: result.files,
      prompts: result.prompts,
    })

    handleClose()
  }

  return (
    <Sheet open={open} onOpenChange={(value) => !value && handleClose()}>
      <SheetContent
        side="right"
        className="flex h-dvh min-h-0 flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:data-[side=right]:w-[54rem] sm:data-[side=right]:max-w-[54rem]"
      >
        <SheetHeader className="shrink-0 border-b px-5 pb-4 pt-5 pr-12">
          <SheetTitle>Novo projeto</SheetTitle>
          <SheetDescription>
            Preencha o briefing e gere automaticamente os arquivos base e prompts do projeto.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="grid gap-6 px-5 py-5">
            {errors.length > 0 ? (
              <Alert variant="destructive">
                <div className="grid gap-1 text-sm">
                  <p className="font-medium">Alguns campos precisam de atenção</p>
                  {errors.map((error) => (
                    <p key={`${error.path}-${error.message}`}>{error.message}</p>
                  ))}
                </div>
              </Alert>
            ) : null}

            <div className="grid gap-4 rounded-xl border bg-muted/15 p-4 md:grid-cols-2">
              <Field label="Nome do projeto *">
                <Input
                  value={form.projectName}
                  onChange={(event) => set("projectName", event.target.value)}
                  placeholder="Ex: Site Clínica Aurora"
                />
              </Field>
              <Field label="Template *">
                <select
                  value={form.templateId}
                  onChange={(event) => set("templateId", event.target.value as SiteFactoryProjectFormState["templateId"])}
                  className="h-10 rounded-md border border-input bg-transparent px-3 text-base outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
                >
                  {SITE_FACTORY_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="md:col-span-2 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
                {activeTemplate?.summary}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Negócio *">
                <Input
                  value={form.businessName}
                  onChange={(event) => set("businessName", event.target.value)}
                  placeholder="Nome da empresa ou profissional"
                />
              </Field>
              <Field label="Segmento *">
                <Input
                  value={form.businessSegment}
                  onChange={(event) => set("businessSegment", event.target.value)}
                  placeholder="Ex: clínica odontológica"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Resumo do projeto *">
                  <Textarea
                    value={form.summary}
                    onChange={(event) => set("summary", event.target.value)}
                    className="min-h-28 resize-none"
                    placeholder="Descreva contexto, objetivo e o que esse site precisa resolver."
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Público-alvo *">
                  <Textarea
                    value={form.targetAudience}
                    onChange={(event) => set("targetAudience", event.target.value)}
                    className="min-h-24 resize-none"
                    placeholder="Quem precisa ser convencido, acolhido ou ativado por esse site?"
                  />
                </Field>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Objetivos *" helper="Separe por vírgula ou quebra de linha.">
                <Textarea
                  value={form.goals}
                  onChange={(event) => set("goals", event.target.value)}
                  className="min-h-24 resize-none"
                  placeholder="Gerar leads, posicionar a marca, receber agendamentos"
                />
              </Field>
              <Field label="Ofertas / serviços *" helper="Separe por vírgula ou quebra de linha.">
                <Textarea
                  value={form.offerings}
                  onChange={(event) => set("offerings", event.target.value)}
                  className="min-h-24 resize-none"
                  placeholder="Consultas, tratamentos, serviços"
                />
              </Field>
              <Field label="Diferenciais" helper="Separe por vírgula ou quebra de linha.">
                <Textarea
                  value={form.differentiators}
                  onChange={(event) => set("differentiators", event.target.value)}
                  className="min-h-24 resize-none"
                  placeholder="Atendimento humanizado, equipe premiada"
                />
              </Field>
              <Field label="Tom desejado" helper="Ex: elegante, técnico, acolhedor.">
                <Textarea
                  value={form.toneAttributes}
                  onChange={(event) => set("toneAttributes", event.target.value)}
                  className="min-h-24 resize-none"
                  placeholder="Separe por vírgula ou quebra de linha"
                />
              </Field>
              <Field label="Seções obrigatórias" helper="Se vazio, o template sugere automaticamente.">
                <Textarea
                  value={form.requiredSections}
                  onChange={(event) => set("requiredSections", event.target.value)}
                  className="min-h-24 resize-none"
                  placeholder="Hero, Serviços, FAQ, CTA final"
                />
              </Field>
              <Field label="Palavras-chave SEO" helper="Separe por vírgula ou quebra de linha.">
                <Textarea
                  value={form.seoKeywords}
                  onChange={(event) => set("seoKeywords", event.target.value)}
                  className="min-h-24 resize-none"
                  placeholder="advogada em vila velha, harmonização facial"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="CTA principal">
                <Input
                  value={form.callToAction}
                  onChange={(event) => set("callToAction", event.target.value)}
                  placeholder="Entrar em contato"
                />
              </Field>
              <Field label="Localização">
                <Input
                  value={form.location}
                  onChange={(event) => set("location", event.target.value)}
                  placeholder="Ex: Vila Velha - ES"
                />
              </Field>
              <Field label="Referências" helper="Links separados por vírgula ou quebra de linha.">
                <Textarea
                  value={form.references}
                  onChange={(event) => set("references", event.target.value)}
                  className="min-h-24 resize-none"
                  placeholder="https://..."
                />
              </Field>
              <Field label="Restrições" helper="Ex: mobile first, evitar tom agressivo.">
                <Textarea
                  value={form.constraints}
                  onChange={(event) => set("constraints", event.target.value)}
                  className="min-h-24 resize-none"
                  placeholder="Separe por vírgula ou quebra de linha"
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Observações">
                  <Textarea
                    value={form.notes}
                    onChange={(event) => set("notes", event.target.value)}
                    className="min-h-28 resize-none"
                    placeholder="Observações extras para orientar os arquivos e prompts."
                  />
                </Field>
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border bg-muted/15 p-4 md:grid-cols-2">
              <Field label="Email">
                <Input value={form.contactEmail} onChange={(event) => set("contactEmail", event.target.value)} />
              </Field>
              <Field label="Telefone">
                <Input value={form.contactPhone} onChange={(event) => set("contactPhone", event.target.value)} />
              </Field>
              <Field label="WhatsApp">
                <Input
                  value={form.contactWhatsapp}
                  onChange={(event) => set("contactWhatsapp", event.target.value)}
                />
              </Field>
              <Field label="Instagram">
                <Input
                  value={form.contactInstagram}
                  onChange={(event) => set("contactInstagram", event.target.value)}
                />
              </Field>
              <Field label="Website atual">
                <Input
                  value={form.contactWebsite}
                  onChange={(event) => set("contactWebsite", event.target.value)}
                />
              </Field>
              <Field label="Endereço">
                <Input
                  value={form.contactAddress}
                  onChange={(event) => set("contactAddress", event.target.value)}
                />
              </Field>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 flex flex-row gap-2 border-t px-5 py-4">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSubmit}>
            Gerar projeto
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
