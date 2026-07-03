import { ImageResponse } from "next/og"

import { getPublicProposalByToken } from "@/lib/proposals/public-server"

export const alt = "Preview da proposta comercial"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

function formatDate(value: string) {
  if (!value) return ""
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default async function Image({
  params,
}: {
  params: Promise<{ public_token: string }>
}) {
  const { public_token } = await params
  const proposal = await getPublicProposalByToken(public_token)

  const clientName = proposal?.clientName || "Proposta comercial"
  const objective = proposal?.objective || "Visualização pública da proposta compartilhada."
  const issueDate = proposal?.proposalDate ? formatDate(proposal.proposalDate) : ""

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#0a0a0c",
          color: "#f4f2ee",
          padding: "52px 56px",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 78% 0%, rgba(113,32,209,0.34), transparent 36%), radial-gradient(circle at 8% 100%, rgba(162,85,253,0.18), transparent 30%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ display: "flex", width: 54, height: 54, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  width: 36,
                  height: 46,
                  left: 0,
                  top: 0,
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  borderTopLeftRadius: 4,
                  background: "#7120d1",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 36,
                  height: 30,
                  right: 0,
                  bottom: 0,
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                  borderTopRightRadius: 4,
                  background: "#a255fd",
                }}
              />
            </div>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em" }}>
              Urlan Dipré
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 18,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              color: "rgba(244,242,238,0.48)",
            }}
          >
            {issueDate || "Proposta comercial"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 870, zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: "#a255fd",
            }}
          >
            Proposta comercial
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 92,
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              fontWeight: 500,
              maxWidth: 860,
            }}
          >
            <span style={{ display: "flex" }}>Preparada para</span>
            <span style={{ display: "flex", color: "#a255fd", fontStyle: "italic" }}>{clientName}</span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 28,
              lineHeight: 1.45,
              color: "rgba(244,242,238,0.74)",
              maxWidth: 760,
            }}
          >
            {objective.length > 170 ? `${objective.slice(0, 167)}...` : objective}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 56 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span
                style={{
                  display: "flex",
                  fontSize: 16,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(244,242,238,0.46)",
                }}
              >
                Emissão
              </span>
              <span style={{ display: "flex", fontSize: 22, color: "rgba(244,242,238,0.82)" }}>
                {issueDate || "Disponível agora"}
              </span>
            </div>
            {proposal?.estimatedDeadline ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span
                  style={{
                    display: "flex",
                    fontSize: 16,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "rgba(244,242,238,0.46)",
                  }}
                >
                  Prazo
                </span>
                <span style={{ display: "flex", fontSize: 22, color: "rgba(244,242,238,0.82)" }}>
                  {proposal.estimatedDeadline}
                </span>
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 16,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(244,242,238,0.46)",
            }}
          >
            <span style={{ display: "flex" }}>Role para ver</span>
            <span style={{ display: "flex", width: 2, height: 44, background: "#a255fd" }} />
          </div>
        </div>
      </div>
    ),
    size
  )
}
