import { getWarrantyDaysLeft, type ClientEntry } from "@/lib/clients/store"

export function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatDate(value: string | null | undefined, fallback = "Sem data") {
  if (!value) return fallback
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
}

export function getWarrantyLabel(client: ClientEntry) {
  const days = getWarrantyDaysLeft(client)
  if (days === null) return "Sem entrega"
  if (days <= 0) return "Garantia encerrada"
  return `Restam ${days} dias`
}

export function isWarrantyActive(client: ClientEntry) {
  const days = getWarrantyDaysLeft(client)
  return days !== null && days > 0
}
