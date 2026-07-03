import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PublicProposalPage as PublicProposalScreen } from "@/components/proposals/public-proposal-page"
import { buildPublicProposalUrl } from "@/lib/proposals/public"
import { getPublicProposalByToken } from "@/lib/proposals/public-server"

export const dynamic = "force-dynamic"

function buildProposalShareDescription(objective: string, estimatedDeadline: string) {
  const parts = [objective.trim(), estimatedDeadline.trim() ? `Prazo estimado: ${estimatedDeadline.trim()}.` : ""]
    .filter(Boolean)
  return parts.join(" ").slice(0, 220)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ public_token: string }>
}): Promise<Metadata> {
  const { public_token } = await params
  const proposal = await getPublicProposalByToken(public_token)

  if (!proposal) {
    return {
      title: "Proposta não encontrada | Atlas",
      description: "Esta proposta não está mais disponível.",
    }
  }

  const url = buildPublicProposalUrl(proposal.publicToken)
  const title = `Proposta para ${proposal.clientName}`
  const description = buildProposalShareDescription(proposal.objective, proposal.estimatedDeadline)

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Atlas",
      type: "website",
      images: [
        {
          url: `${url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Preview da proposta para ${proposal.clientName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${url}/opengraph-image`],
    },
  }
}

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ public_token: string }>
}) {
  const { public_token } = await params
  const token = public_token?.trim().toLowerCase()

  if (!token) {
    notFound()
  }

  const proposal = await getPublicProposalByToken(token)

  if (!proposal) {
    notFound()
  }

  return <PublicProposalScreen proposal={proposal} />
}
