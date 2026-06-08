import { type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret")
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return Response.json({ error: "name is required" }, { status: 422 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("crm_incoming_leads").insert({
    name: String(body.name).trim(),
    email: body.email ? String(body.email).trim() : null,
    phone: body.phone ? String(body.phone).trim() : null,
    whatsapp: body.whatsapp ? String(body.whatsapp).trim() : null,
    company: body.company ? String(body.company).trim() : null,
    segment: body.segment ? String(body.segment).trim() : null,
    city: body.city ? String(body.city).trim() : null,
    state: body.state ? String(body.state).trim() : null,
    current_site: body.current_site ? String(body.current_site).trim() : null,
    instagram: body.instagram ? String(body.instagram).trim() : null,
    project_type: body.project_type ? String(body.project_type).trim() : null,
    project_objective: body.project_objective ? String(body.project_objective).trim() : null,
    desired_deadline: body.desired_deadline ? String(body.desired_deadline).trim() : null,
    investment_range: body.investment_range ? String(body.investment_range).trim() : null,
    origin: body.origin ? String(body.origin).trim() : null,
    estimated_value: body.estimated_value
      ? parseFloat(String(body.estimated_value).replace(",", ".")) || null
      : null,
    responsible: body.responsible ? String(body.responsible).trim() : null,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 201 })
}
