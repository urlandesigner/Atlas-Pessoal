"use client"

import { useEffect } from "react"

export default function PrintProposalPage() {
  useEffect(() => {
    const html = sessionStorage.getItem("atlas-print-proposal")
    if (!html) {
      window.close()
      return
    }
    document.open()
    document.write(html)
    document.close()
    window.print()
  }, [])

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#666" }}>
      Carregando proposta…
    </div>
  )
}
