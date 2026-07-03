import "server-only"

import { cache } from "react"

import { createAdminClient } from "@/lib/supabase/admin"
import { toPublicProposalData, type PublicProposalData } from "@/lib/proposals/public"
import { rowToProposal } from "@/lib/supabase/proposal-mapper"

export const getPublicProposalByToken = cache(async (publicToken: string): Promise<PublicProposalData | null> => {
  const token = publicToken.trim().toLowerCase()
  if (!token) return null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("public_token", token)
    .maybeSingle()

  if (error) {
    console.error("[public proposal] fetch:", error.message)
    return null
  }

  if (!data) return null

  return toPublicProposalData(rowToProposal(data as Record<string, unknown>))
})
