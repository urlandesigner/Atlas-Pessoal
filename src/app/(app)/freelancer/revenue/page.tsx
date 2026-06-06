"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface PaymentEntry {
  id: string
  date: string
  amount: number
  type: "income" | "expense"
  notes: string | null
}

interface ProjectEntry {
  id: string
  name: string
  clientName?: string
  payments: PaymentEntry[]
}

type AllProjects = Record<"professional" | "personal" | "freelancer", ProjectEntry[]>

const STORAGE_KEY = "atlas_projects"

function loadAll(): AllProjects | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

interface FlatPayment extends PaymentEntry {
  projectName: string
  clientName?: string
  workspace: string
}

export default function RevenuePage() {
  const [payments, setPayments] = useState<FlatPayment[]>([])

  useEffect(() => {
    const all = loadAll()
    if (!all) return

    const flat: FlatPayment[] = []
    const workspaces = ["professional", "personal", "freelancer"] as const
    for (const ws of workspaces) {
      for (const project of all[ws] ?? []) {
        for (const p of project.payments ?? []) {
          flat.push({ ...p, projectName: project.name, clientName: project.clientName, workspace: ws })
        }
      }
    }
    flat.sort((a, b) => b.date.localeCompare(a.date))
    setPayments(flat)
  }, [])

  const totalIncome = payments.filter((p) => p.type === "income").reduce((s, p) => s + p.amount, 0)
  const totalExpense = payments.filter((p) => p.type === "expense").reduce((s, p) => s + p.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Receitas e despesas de todos os projetos
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas</CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {totalIncome > 0 ? formatBRL(totalIncome) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payments.filter((p) => p.type === "income").length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas</CardTitle>
            <TrendingDown className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {totalExpense > 0 ? formatBRL(totalExpense) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payments.filter((p) => p.type === "expense").length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              {payments.length > 0 ? formatBRL(balance) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">receitas − despesas</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Histórico</p>
        <Card>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                  <DollarSign className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum pagamento registrado ainda.
                  <br />
                  Adicione nos detalhes de cada projeto.
                </p>
              </div>
            ) : (
              <ul>
                {payments.map((p, i) => (
                  <li key={p.id}>
                    {i > 0 && <Separator />}
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{p.projectName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">{formatDate(p.date)}</span>
                          {p.notes && (
                            <>
                              <span className="text-xs text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground truncate">{p.notes}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-xs font-normal ${p.type === "income" ? "text-emerald-600 border-emerald-200" : "text-rose-500 border-rose-200"}`}>
                          {p.type === "income" ? "Receita" : "Despesa"}
                        </Badge>
                        <span className={`text-sm font-medium tabular-nums ${p.type === "income" ? "text-emerald-600" : "text-rose-500"}`}>
                          {p.type === "expense" ? "−" : "+"}{formatBRL(p.amount)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
