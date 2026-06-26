import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { rowToProposal } from "@/lib/supabase/proposal-mapper"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase.from("proposals").select("*").eq("id", id).maybeSingle()

  if (error) {
    console.error("[api/proposals] fetch:", error.message)
    return NextResponse.json({ error: "Erro ao buscar proposta" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 })
  }

  return NextResponse.json(rowToProposal(data as Record<string, unknown>))
}
