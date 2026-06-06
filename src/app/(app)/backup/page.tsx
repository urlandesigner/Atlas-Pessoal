"use client"

import { useRef, useState } from "react"
import { Download, Upload, ShieldCheck, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Página de backup / restauração dos dados locais (localStorage).
 *
 * Sistema PESSOAL: importa apenas as chaves pessoais/freelancer e, no caso de
 * `atlas_projects`, mantém somente as fatias "personal" e "freelancer".
 */

// Chaves que esta instância importa de volta. `null` = todas as chaves atlas_*.
const IMPORT_KEYS: string[] | null = [
  "atlas_clients",
  "atlas_crm_leads",
  "atlas_proposals",
  "atlas_projects",
]

// Mantém somente os workspaces deste sistema ao importar atlas_projects.
const PROJECTS_WORKSPACES = ["personal", "freelancer"] as const

type BackupFile = {
  app: string
  version: number
  exportedAt: string
  data: Record<string, unknown>
}

function collectAtlasKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith("atlas_")) keys.push(k)
  }
  return keys
}

export default function BackupPage() {
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; msg: string }>({
    kind: "idle",
    msg: "",
  })
  const [foundKeys, setFoundKeys] = useState<string[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleExport() {
    try {
      const keys = collectAtlasKeys()
      const data: Record<string, unknown> = {}
      for (const k of keys) {
        const raw = localStorage.getItem(k)
        if (raw == null) continue
        try {
          data[k] = JSON.parse(raw)
        } catch {
          data[k] = raw
        }
      }
      const payload: BackupFile = {
        app: "atlas",
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")
      a.download = `atlas-backup-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setFoundKeys(keys)
      setStatus({ kind: "ok", msg: `Backup gerado com ${keys.length} chave(s).` })
    } catch (err) {
      setStatus({ kind: "error", msg: `Falha ao exportar: ${String(err)}` })
    }
  }

  function handleImportClick() {
    fileRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as BackupFile
      if (!parsed || typeof parsed !== "object" || !parsed.data) {
        throw new Error("Arquivo de backup inválido.")
      }
      const entries = Object.entries(parsed.data)
      let written = 0
      for (const [key, value] of entries) {
        if (!key.startsWith("atlas_")) continue
        if (IMPORT_KEYS && !IMPORT_KEYS.includes(key)) continue
        if (key === "atlas_projects" && value && typeof value === "object") {
          const src = value as Record<string, unknown>
          const sliced: Record<string, unknown> = {}
          for (const ws of PROJECTS_WORKSPACES) {
            sliced[ws] = Array.isArray(src[ws]) ? src[ws] : []
          }
          localStorage.setItem(key, JSON.stringify(sliced))
          written++
          continue
        }
        localStorage.setItem(key, JSON.stringify(value))
        written++
      }
      setStatus({
        kind: "ok",
        msg: `${written} chave(s) restaurada(s). Recarregue a página para ver os dados.`,
      })
    } catch (err) {
      setStatus({ kind: "error", msg: `Falha ao importar: ${String(err)}` })
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Backup de dados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus dados ficam salvos apenas neste navegador. Exporte um arquivo para preservá-los ou
          migrá-los para os sistemas Profissional e Pessoal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-4" />
            Exportar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Gera um arquivo <code className="rounded bg-muted px-1 py-0.5">atlas-backup.json</code>{" "}
            com os dados deste sistema (projetos pessoais e freelancer, clientes, propostas e
            leads/CRM).
          </p>
          <Button onClick={handleExport} className="w-fit">
            <Download className="size-4" />
            Exportar backup
          </Button>
          {foundKeys && (
            <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              {foundKeys.map((k) => (
                <li key={k}>• {k}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="size-4" />
            Restaurar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Importa um arquivo de backup e sobrescreve os dados deste sistema com o conteúdo
            correspondente.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />
          <Button variant="outline" onClick={handleImportClick} className="w-fit">
            <Upload className="size-4" />
            Importar backup
          </Button>
        </CardContent>
      </Card>

      {status.kind !== "idle" && (
        <div
          className={
            status.kind === "ok"
              ? "flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300"
              : "flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-700 dark:text-rose-300"
          }
        >
          {status.kind === "ok" ? (
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          )}
          <span>{status.msg}</span>
        </div>
      )}
    </div>
  )
}
