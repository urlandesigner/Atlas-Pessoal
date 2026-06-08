import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("crm_incoming_leads")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[leads/incoming] fetch error:", error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (data && data.length > 0) {
    const ids = data.map((r) => r.id)
    const { error: updateError } = await supabase
      .from("crm_incoming_leads")
      .update({ processed: true })
      .in("id", ids)

    if (updateError) {
      console.error("[leads/incoming] mark-processed error:", updateError.message)
    }
  }

  return Response.json({ leads: data ?? [] })
}
