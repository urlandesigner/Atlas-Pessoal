"use client"

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import { useParams } from "next/navigation"
import { Fraunces } from "next/font/google"

import {
  DOMAIN_ADDON_PRICE,
  getProposalAddonTotal,
  getProposalDevelopmentTotal,
  getProposalDisplayTotal,
  getProposalPaymentMethod,
  getProposalsServerSnapshot,
  resolveProposalPartnership,
  getProposalsSnapshot,
  HOSTING_ADDON_PRICE,
  subscribeProposalsStore,
} from "@/lib/proposals/store"

function subscribeClientHydrated(onStoreChange: () => void) {
  onStoreChange()
  return () => {}
}

function getClientHydratedSnapshot() {
  return true
}

function getServerHydratedSnapshot() {
  return false
}

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
})

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—"
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

// ─── WhatsApp icon ───────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className ?? "size-5"} aria-hidden>
      <path d="M16 2.4C8.5 2.4 2.4 8.5 2.4 16c0 2.4.6 4.7 1.8 6.7L2.4 29.6l7.2-1.8c1.9 1 4.1 1.6 6.4 1.6 7.5 0 13.6-6.1 13.6-13.6S23.5 2.4 16 2.4zm0 24.8c-2.1 0-4.1-.6-5.8-1.6l-.4-.2-4.3 1.1 1.1-4.2-.3-.4C5.2 20.1 4.6 18.1 4.6 16 4.6 9.7 9.7 4.6 16 4.6S27.4 9.7 27.4 16 22.3 27.2 16 27.2zm7.5-9.9c-.4-.2-2.4-1.2-2.8-1.3-.4-.1-.6-.2-.9.2s-1 1.3-1.2 1.6c-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.5.4-.7.1-.2 0-.5-.1-.7-.1-.2-.9-2.1-1.2-2.9-.3-.8-.6-.7-.9-.7h-.7c-.3 0-.7.1-1 .5s-1.4 1.4-1.4 3.3 1.4 3.8 1.6 4.1c.2.3 2.8 4.2 6.7 5.9 4 1.7 4 1.1 4.7 1 .7-.1 2.3-.9 2.6-1.8.3-.9.3-1.7.2-1.8-.1-.2-.4-.3-.7-.5z" />
    </svg>
  )
}

// ─── Brand symbol (extraído do logo) ─────────────────────────────────────────

// Símbolo isolado (apenas a marca roxa)
function BrandSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 409 319" fill="none" className={className} aria-hidden>
      <path
        d="M0 20C0 8.9543 8.9543 0 20 0H197.875C208.921 0 217.876 8.95431 217.876 20V210.062C217.876 270.227 169.102 319 108.938 319C48.7731 319 0 270.227 0 210.062V20Z"
        fill="var(--accent)"
      />
      <path
        d="M189.891 120C189.891 108.954 198.846 100 209.891 100H388.766C399.812 100 408.766 108.954 408.766 120V209.5C408.766 253.5 364.292 319 303.826 319C237.301 319 176.598 319 93.9463 319C93.9463 319 129.926 312 161.907 280.5C187.716 255.08 189.891 209.5 189.891 209.5V120Z"
        fill="var(--accent-2)"
      />
    </svg>
  )
}

// Logo completo (wordmark vetorizado + símbolo). O texto usa currentColor
// para adaptar ao fundo; o símbolo mantém o roxo da marca.
function BrandLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1707 319" fill="none" className={className} aria-label="Urlan Dipré">
      <path
        d="M600.916 243.16C587.769 243.16 576.633 240.917 567.508 236.432C558.537 231.947 551.268 225.837 545.7 218.104C540.286 210.371 536.265 201.555 533.636 191.656C531.161 181.757 529.924 171.472 529.924 160.8V77.28H555.908V160.8C555.908 168.379 556.681 175.725 558.228 182.84C559.774 189.8 562.249 196.064 565.652 201.632C569.054 207.2 573.617 211.608 579.34 214.856C585.217 218.104 592.409 219.728 600.916 219.728C609.577 219.728 616.769 218.104 622.492 214.856C628.369 211.453 632.932 206.968 636.18 201.4C639.582 195.677 642.057 189.336 643.604 182.376C645.15 175.416 645.924 168.224 645.924 160.8V77.28H672.14V160.8C672.14 172.091 670.748 182.763 667.964 192.816C665.334 202.715 661.158 211.453 655.436 219.032C649.868 226.456 642.598 232.333 633.628 236.664C624.657 240.995 613.753 243.16 600.916 243.16ZM769.618 142.704C759.719 142.859 750.903 145.101 743.17 149.432C735.591 153.763 730.178 159.872 726.93 167.76V242H701.41V120.664H725.074V147.808C729.25 139.456 734.74 132.805 741.546 127.856C748.351 122.752 755.543 119.968 763.122 119.504C764.668 119.504 765.906 119.504 766.834 119.504C767.916 119.504 768.844 119.581 769.618 119.736V142.704ZM788.415 72.64H813.935V206.968C813.935 213.155 814.863 217.099 816.719 218.8C818.575 220.501 820.895 221.352 823.679 221.352C826.772 221.352 829.634 221.043 832.263 220.424C835.047 219.805 837.444 219.032 839.455 218.104L843.167 238.288C839.455 239.835 835.047 241.149 829.943 242.232C824.839 243.315 820.276 243.856 816.255 243.856C807.594 243.856 800.788 241.459 795.839 236.664C790.89 231.715 788.415 224.909 788.415 216.248V72.64ZM849.148 206.504C849.148 198.771 851.314 192.043 855.644 186.32C860.13 180.443 866.239 175.957 873.972 172.864C881.706 169.616 890.676 167.992 900.884 167.992C906.298 167.992 911.788 168.379 917.356 169.152C923.079 169.925 928.106 171.163 932.436 172.864V165.208C932.436 156.701 929.884 150.051 924.78 145.256C919.676 140.461 912.33 138.064 902.74 138.064C895.935 138.064 889.516 139.301 883.484 141.776C877.452 144.096 871.034 147.421 864.228 151.752L855.644 134.584C863.687 129.171 871.73 125.149 879.772 122.52C887.97 119.891 896.554 118.576 905.524 118.576C921.764 118.576 934.524 122.907 943.804 131.568C953.239 140.075 957.956 152.216 957.956 167.992V213.232C957.956 216.171 958.42 218.259 959.348 219.496C960.431 220.733 962.21 221.429 964.684 221.584V242C962.364 242.464 960.276 242.773 958.42 242.928C956.564 243.083 955.018 243.16 953.78 243.16C948.367 243.16 944.268 241.845 941.484 239.216C938.7 236.587 937.076 233.493 936.612 229.936L935.916 222.976C930.658 229.781 923.93 235.04 915.732 238.752C907.535 242.464 899.26 244.32 890.908 244.32C882.866 244.32 875.674 242.696 869.332 239.448C862.991 236.045 858.042 231.483 854.484 225.76C850.927 220.037 849.148 213.619 849.148 206.504ZM926.404 213.928C928.26 211.917 929.73 209.907 930.812 207.896C931.895 205.885 932.436 204.107 932.436 202.56V188.64C928.106 186.939 923.543 185.701 918.748 184.928C913.954 184 909.236 183.536 904.596 183.536C895.316 183.536 887.738 185.392 881.86 189.104C876.138 192.816 873.276 197.92 873.276 204.416C873.276 207.973 874.204 211.376 876.06 214.624C878.071 217.872 880.855 220.501 884.412 222.512C888.124 224.523 892.687 225.528 898.1 225.528C903.668 225.528 909.004 224.445 914.108 222.28C919.212 220.115 923.311 217.331 926.404 213.928ZM1097.73 242H1072.21V174.024C1072.21 162.733 1070.35 154.459 1066.64 149.2C1063.08 143.941 1057.74 141.312 1050.63 141.312C1045.68 141.312 1040.73 142.549 1035.78 145.024C1030.99 147.499 1026.66 150.901 1022.79 155.232C1018.92 159.408 1016.14 164.28 1014.44 169.848V242H988.917V120.664H1012.12V145.024C1015.21 139.611 1019.23 134.971 1024.18 131.104C1029.29 127.083 1035.01 123.989 1041.35 121.824C1047.69 119.659 1054.42 118.576 1061.53 118.576C1068.8 118.576 1074.76 119.891 1079.4 122.52C1084.19 125.149 1087.9 128.784 1090.53 133.424C1093.32 137.909 1095.17 143.168 1096.1 149.2C1097.18 155.077 1097.73 161.341 1097.73 167.992V242ZM1153.57 242V77.28H1212.03C1229.82 77.28 1244.67 80.992 1256.58 88.416C1268.49 95.6853 1277.38 105.584 1283.26 118.112C1289.29 130.485 1292.3 144.251 1292.3 159.408C1292.3 176.112 1288.98 190.651 1282.33 203.024C1275.83 215.397 1266.55 224.987 1254.49 231.792C1242.42 238.597 1228.27 242 1212.03 242H1153.57ZM1265.86 159.408C1265.86 147.808 1263.69 137.6 1259.36 128.784C1255.18 119.813 1249.08 112.853 1241.03 107.904C1233.14 102.8 1223.48 100.248 1212.03 100.248H1179.55V219.032H1212.03C1223.63 219.032 1233.38 216.403 1241.26 211.144C1249.31 205.885 1255.42 198.771 1259.59 189.8C1263.77 180.829 1265.86 170.699 1265.86 159.408ZM1311.52 242V120.664H1337.04V242H1311.52ZM1311.52 100.712V72.64H1337.04V100.712H1311.52ZM1431.98 244.32C1422.23 244.32 1413.65 242 1406.22 237.36C1398.8 232.72 1392.92 226.688 1388.59 219.264V291.416H1363.07V120.664H1385.58V142.472C1390.22 135.203 1396.25 129.403 1403.67 125.072C1411.1 120.741 1419.37 118.576 1428.5 118.576C1436.85 118.576 1444.5 120.277 1451.46 123.68C1458.42 126.928 1464.46 131.491 1469.56 137.368C1474.66 143.245 1478.61 149.973 1481.39 157.552C1484.33 164.976 1485.8 172.864 1485.8 181.216C1485.8 192.816 1483.48 203.411 1478.84 213C1474.35 222.589 1468.01 230.245 1459.82 235.968C1451.77 241.536 1442.49 244.32 1431.98 244.32ZM1423.62 222.512C1429.04 222.512 1433.91 221.352 1438.24 219.032C1442.73 216.712 1446.51 213.619 1449.61 209.752C1452.86 205.885 1455.33 201.477 1457.03 196.528C1458.73 191.579 1459.58 186.475 1459.58 181.216C1459.58 175.648 1458.66 170.389 1456.8 165.44C1454.94 160.491 1452.24 156.16 1448.68 152.448C1445.28 148.736 1441.26 145.797 1436.62 143.632C1432.13 141.467 1427.18 140.384 1421.77 140.384C1418.52 140.384 1415.12 141.003 1411.56 142.24C1408 143.477 1404.68 145.179 1401.58 147.344C1398.49 149.509 1395.78 152.061 1393.46 155C1391.14 157.939 1389.52 161.032 1388.59 164.28V196.064C1390.76 201.013 1393.62 205.499 1397.18 209.52C1400.73 213.387 1404.83 216.557 1409.47 219.032C1414.11 221.352 1418.83 222.512 1423.62 222.512ZM1572.32 142.704C1562.42 142.859 1553.6 145.101 1545.87 149.432C1538.29 153.763 1532.88 159.872 1529.63 167.76V242H1504.11V120.664H1527.78V147.808C1531.95 139.456 1537.44 132.805 1544.25 127.856C1551.05 122.752 1558.24 119.968 1565.82 119.504C1567.37 119.504 1568.61 119.504 1569.54 119.504C1570.62 119.504 1571.55 119.581 1572.32 119.736V142.704ZM1638.96 244.32C1629.53 244.32 1620.94 242.696 1613.21 239.448C1605.63 236.045 1599.06 231.483 1593.49 225.76C1587.92 219.883 1583.59 213.232 1580.5 205.808C1577.56 198.229 1576.09 190.187 1576.09 181.68C1576.09 170.235 1578.72 159.795 1583.98 150.36C1589.24 140.771 1596.58 133.115 1606.02 127.392C1615.45 121.515 1626.51 118.576 1639.2 118.576C1651.88 118.576 1662.78 121.515 1671.91 127.392C1681.19 133.115 1688.38 140.693 1693.48 150.128C1698.59 159.563 1701.14 169.693 1701.14 180.52C1701.14 182.376 1701.06 184.155 1700.91 185.856C1700.75 187.403 1700.6 188.717 1700.44 189.8H1603.24C1603.7 196.915 1605.63 203.179 1609.04 208.592C1612.59 213.851 1617.08 218.027 1622.49 221.12C1627.9 224.059 1633.7 225.528 1639.89 225.528C1646.7 225.528 1653.12 223.827 1659.15 220.424C1665.33 217.021 1669.51 212.536 1671.68 206.968L1693.48 213.232C1690.85 219.109 1686.83 224.445 1681.42 229.24C1676.16 233.88 1669.9 237.592 1662.63 240.376C1655.36 243.005 1647.47 244.32 1638.96 244.32ZM1602.54 172.864H1675.85C1675.39 165.904 1673.38 159.795 1669.82 154.536C1666.42 149.123 1662.01 144.947 1656.6 142.008C1651.34 138.915 1645.46 137.368 1638.96 137.368C1632.62 137.368 1626.74 138.915 1621.33 142.008C1616.07 144.947 1611.74 149.123 1608.34 154.536C1604.94 159.795 1603 165.904 1602.54 172.864ZM1647.08 103.264L1630.38 98.16L1643.6 72.64H1667.96L1647.08 103.264Z"
        fill="currentColor"
      />
      <path
        d="M0 20C0 8.9543 8.9543 0 20 0H197.875C208.921 0 217.876 8.95431 217.876 20V210.062C217.876 270.227 169.102 319 108.938 319C48.7731 319 0 270.227 0 210.062V20Z"
        fill="var(--accent)"
      />
      <path
        d="M189.891 120C189.891 108.954 198.846 100 209.891 100H388.766C399.812 100 408.766 108.954 408.766 120V209.5C408.766 253.5 364.292 319 303.826 319C237.301 319 176.598 319 93.9463 319C93.9463 319 129.926 312 161.907 280.5C187.716 255.08 189.891 209.5 189.891 209.5V120Z"
        fill="var(--accent-2)"
      />
    </svg>
  )
}

// ─── Scroll reveal ───────────────────────────────────────────────────────────

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "reveal-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-10 flex items-baseline gap-4">
      <span className="font-mono text-sm tracking-[0.3em] text-[var(--accent-2)]">{index}</span>
      <span className="h-px flex-1 bg-[var(--line)]" />
      <span className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
        {title}
      </span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProposalWebPage() {
  const params = useParams<{ id: string }>()
  const proposals = useSyncExternalStore(
    subscribeProposalsStore,
    getProposalsSnapshot,
    getProposalsServerSnapshot
  )
  const mounted = useSyncExternalStore(
    subscribeClientHydrated,
    getClientHydratedSnapshot,
    getServerHydratedSnapshot
  )

  const proposal = proposals.find((p) => p.id === params.id)

  if (!mounted) {
    return <div className={`${fraunces.variable} proposal-web min-h-screen`} />
  }

  if (!proposal) {
    return (
      <div className={`${fraunces.variable} proposal-web flex min-h-screen flex-col items-center justify-center gap-6 text-center`}>
        <BrandSymbol className="h-16 w-auto opacity-60" />
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
          Proposta não encontrada
        </p>
        <ProposalStyles />
      </div>
    )
  }

  const includeDomain = proposal.included.some((i) => /(domínio|dominio)/i.test(i))
  const includeHosting = proposal.included.some((i) => /hospedagem/i.test(i))
  const addonTotal = getProposalAddonTotal(proposal.included)
  const isPartnership = resolveProposalPartnership(
    proposal.isPartnership,
    proposal.totalValue,
    proposal.included
  )
  const displayTotal = getProposalDisplayTotal(proposal.isPartnership, proposal.totalValue, proposal.included)
  const baseTotal = getProposalDevelopmentTotal(proposal.isPartnership, proposal.totalValue, proposal.included)
  const paymentLabel = getProposalPaymentMethod(
    proposal.isPartnership,
    proposal.paymentMethod,
    proposal.totalValue,
    proposal.included
  )
  const entryValue =
    proposal.entryMode === "percent"
      ? (displayTotal * proposal.entryValue) / 100
      : proposal.entryValue
  const remaining = Math.max(displayTotal - entryValue, 0)

  return (
    <div className={`${fraunces.variable} proposal-web`}>
      <ProposalStyles />

      {/* ── Capa ───────────────────────────────────────────── */}
      <section className="cover relative flex min-h-screen flex-col justify-between overflow-hidden px-6 py-10 sm:px-12 sm:py-14">
        <div className="cover-glow" aria-hidden />

        <header className="relative flex items-center justify-between">
          <BrandLogo className="h-9 w-auto text-[var(--fg)]" />
          <span className="hidden font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)] sm:block">
            {formatDate(proposal.proposalDate)}
          </span>
        </header>

        <div className="relative max-w-4xl">
          <p className="cover-eyebrow font-mono text-xs uppercase tracking-[0.42em] text-[var(--accent-2)]">
            Proposta Comercial
          </p>
          <h1 className="display cover-title mt-6 text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.98] tracking-[-0.02em]">
            Preparada para
            <br />
            <span className="italic text-[var(--accent-2)]">{proposal.clientName}</span>
          </h1>
          {proposal.objective ? (
            <p className="cover-sub mt-8 max-w-xl text-lg leading-relaxed text-[var(--soft)]">
              {proposal.objective}
            </p>
          ) : null}
        </div>

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <dl className="cover-meta flex flex-wrap gap-x-12 gap-y-4">
            <Meta label="Emissão" value={formatDate(proposal.proposalDate)} />
            <Meta label="Validade" value={formatDate(proposal.validUntil)} />
            <Meta label="Prazo" value={proposal.estimatedDeadline || "A definir"} />
          </dl>
          <div className="scroll-cue flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            <span>Role para ver</span>
            <span className="scroll-line h-10 w-px bg-[var(--accent-2)]" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6 sm:px-12">
        {/* ── Objetivo ─────────────────────────────────────── */}
        <Block>
          <Reveal>
            <SectionLabel index="01" title="Objetivo" />
          </Reveal>
          <Reveal delay={80}>
            <p className="display max-w-3xl text-[clamp(1.6rem,3.4vw,2.6rem)] font-light leading-[1.3] tracking-[-0.01em]">
              {proposal.objective || "Objetivo do projeto a definir."}
            </p>
          </Reveal>
        </Block>

        {/* ── Escopo ───────────────────────────────────────── */}
        {proposal.scope.length ? (
          <Block>
            <Reveal>
              <SectionLabel index="02" title="Escopo do projeto" />
            </Reveal>
            <div className="grid gap-px overflow-hidden rounded-2xl bg-[var(--line)] sm:grid-cols-2">
              {proposal.scope.map((category, i) => (
                <Reveal key={category.id} delay={i * 60}>
                  <div className="scope-card h-full bg-[var(--bg)] p-7">
                    <div className="mb-5 flex items-center gap-3">
                      <span className="font-mono text-xs text-[var(--accent-2)]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="display text-xl font-medium">{category.name}</h3>
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      {category.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-[var(--soft)]">
                          <span className="mt-2 size-1 shrink-0 rounded-full bg-[var(--accent-2)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </Block>
        ) : null}

        {/* ── Investimento ─────────────────────────────────── */}
        <Block>
          <Reveal>
            <SectionLabel index="03" title="Investimento" />
          </Reveal>
          <Reveal delay={80}>
            <div className="invest-card overflow-hidden rounded-3xl">
              <div className="invest-glow" aria-hidden />
              <div className="relative p-8 sm:p-12">
                {isPartnership ? (
                  addonTotal > 0 ? (
                    <>
                      <div className="mb-8 flex flex-col gap-3 border-b border-[var(--line)] pb-8 text-[var(--soft)]">
                        <div className="flex items-center justify-between gap-4">
                          <span>Desenvolvimento</span>
                          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-2)]">
                            Gratuito · Parceria
                          </span>
                        </div>
                        {includeDomain ? <Line label="Domínio (anual)" value={money(DOMAIN_ADDON_PRICE)} /> : null}
                        {includeHosting ? <Line label="Hospedagem (anual)" value={money(HOSTING_ADDON_PRICE)} /> : null}
                      </div>
                      <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
                        Total anual
                      </p>
                      <p className="invest-total mt-3 text-[clamp(3rem,9vw,6rem)] font-medium leading-none tracking-[-0.04em] tabular-nums">
                        {money(displayTotal)}
                      </p>
                      <p className="mt-6 max-w-md leading-relaxed text-[var(--soft)]">
                        Desenvolvimento em parceria, sem cobrança. Domínio e hospedagem são cobranças anuais à parte.
                      </p>
                      <div className="mt-8 rounded-2xl border border-[var(--line)] p-5">
                        <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                          Forma de pagamento
                        </p>
                        <p className="mt-2 leading-relaxed text-[var(--soft)]">{paymentLabel}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
                        Investimento total
                      </p>
                      <p className="invest-total mt-3 text-[clamp(3rem,9vw,6rem)] font-medium leading-none tracking-[-0.04em]">
                        Gratuito
                      </p>
                      <span className="mt-6 inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--accent)]/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent-2)]">
                        Parceria
                      </span>
                      <p className="mt-6 max-w-md leading-relaxed text-[var(--soft)]">
                        Projeto executado em parceria, sem cobrança.
                      </p>
                      <div className="mt-8 rounded-2xl border border-[var(--line)] p-5">
                        <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                          Forma de pagamento
                        </p>
                        <p className="mt-2 leading-relaxed text-[var(--soft)]">{paymentLabel}</p>
                      </div>
                    </>
                  )
                ) : (
                  <>
                    {addonTotal > 0 ? (
                      <div className="mb-8 flex flex-col gap-3 border-b border-[var(--line)] pb-8 text-[var(--soft)]">
                        <Line label="Desenvolvimento" value={money(baseTotal)} />
                        {includeDomain ? <Line label="Domínio (anual)" value={`+ ${money(DOMAIN_ADDON_PRICE)}`} /> : null}
                        {includeHosting ? <Line label="Hospedagem (anual)" value={`+ ${money(HOSTING_ADDON_PRICE)}`} /> : null}
                      </div>
                    ) : null}

                    <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--muted)]">
                      Investimento total
                    </p>
                    <p className="invest-total mt-3 text-[clamp(3rem,9vw,6rem)] font-medium leading-none tracking-[-0.04em] tabular-nums">
                      {money(displayTotal)}
                    </p>

                    <div className="mt-10 grid gap-5 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--line)] p-5">
                        <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                          Entrada
                        </p>
                        <p className="mt-2 text-2xl font-medium tabular-nums tracking-tight">{money(entryValue)}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Saldo de {money(remaining)} na entrega
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--line)] p-5">
                        <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                          Forma de pagamento
                        </p>
                        <p className="mt-2 leading-relaxed text-[var(--soft)]">
                          {paymentLabel}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </Block>

        {/* ── Inclusos / Não inclusos ──────────────────────── */}
        {proposal.included.length || proposal.notIncluded.length ? (
          <Block>
            <Reveal>
              <SectionLabel index="04" title="O que está incluso" />
            </Reveal>
            <div className="grid gap-10 sm:grid-cols-2">
              <Reveal delay={60}>
                <h3 className="display mb-5 text-lg font-medium">Incluso no projeto</h3>
                <ul className="flex flex-col gap-3">
                  {proposal.included.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="check mt-0.5">✓</span>
                      <span className="text-[var(--soft)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={120}>
                <h3 className="display mb-5 text-lg font-medium text-[var(--muted)]">Não incluso</h3>
                <ul className="flex flex-col gap-3">
                  {proposal.notIncluded.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[var(--muted)]">
                      <span className="mt-0.5 opacity-50">✕</span>
                      <span className="line-through decoration-[var(--line)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </Block>
        ) : null}

        {/* ── Prazo & observações ──────────────────────────── */}
        <Block>
          <Reveal>
            <SectionLabel index="05" title="Prazo e condições" />
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-[1fr_1.4fr]">
            <Reveal delay={60}>
              <div className="h-full rounded-2xl border border-[var(--line)] p-7">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  Prazo estimado
                </p>
                <p className="display mt-3 text-4xl font-light">
                  {proposal.estimatedDeadline || "A definir"}
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="h-full rounded-2xl border border-[var(--line)] p-7">
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  Observações
                </p>
                <p className="mt-3 leading-relaxed text-[var(--soft)]">
                  {proposal.notes || "Prazo contado após aprovação da proposta e envio dos materiais necessários."}
                </p>
              </div>
            </Reveal>
          </div>
        </Block>

        {/* ── CTA ──────────────────────────────────────────── */}
        <Block>
          <Reveal>
            <div className="cta relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-12 sm:py-20">
              <div className="cta-glow" aria-hidden />
              <p className="relative font-mono text-xs uppercase tracking-[0.4em] text-[var(--accent-2)]">
                Próximo passo
              </p>
              <h2 className="display relative mt-5 text-[clamp(2rem,6vw,4rem)] font-light leading-[1.05] tracking-[-0.02em]">
                Vamos tirar
                <br />
                <span className="italic">do papel?</span>
              </h2>
              <p className="relative mx-auto mt-6 max-w-md text-[var(--soft)]">
                Proposta válida até {formatDate(proposal.validUntil)}. Ao aprovar, iniciamos com a
                entrada e o cronograma combinado.
              </p>
              <div className="relative mt-10 flex justify-center">
                <a
                  href={`https://wa.me/5527999938876?text=${encodeURIComponent(`Olá Urlan! Recebi a proposta para ${proposal.clientName} e gostaria de aprová-la e dar início ao contrato. (Ref. ${proposal.id.slice(0, 8)})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn inline-flex items-center gap-3 rounded-2xl px-8 py-4 text-sm font-medium transition-transform hover:scale-[1.03] active:scale-[0.98]"
                >
                  <WhatsAppIcon />
                  Aceitar proposta via WhatsApp
                </a>
              </div>
            </div>
          </Reveal>
        </Block>
      </main>

      {/* ── Rodapé ───────────────────────────────────────────── */}
      <footer className="mx-auto mt-10 max-w-5xl px-6 pb-16 sm:px-12">
        <div className="flex flex-col items-center gap-6 border-t border-[var(--line)] pt-10 sm:flex-row sm:justify-between">
          <BrandLogo className="h-8 w-auto text-[var(--fg)]" />
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
            Proposta {proposal.id.slice(0, 8)} · {formatDate(proposal.proposalDate)}
          </p>
        </div>
      </footer>
    </div>
  )
}

function Block({ children }: { children: ReactNode }) {
  return <section className="border-t border-[var(--line)] py-20 first:border-t-0 sm:py-28">{children}</section>
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-[var(--muted)]">{label}</dt>
      <dd className="mt-1.5 text-[var(--soft)]">{value}</dd>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function ProposalStyles() {
  return (
    <style jsx global>{`
      .proposal-web {
        --bg: #0a0a0c;
        --surface: #131316;
        --line: rgba(255, 255, 255, 0.1);
        --fg: #f4f2ee;
        --soft: rgba(244, 242, 238, 0.74);
        --muted: rgba(244, 242, 238, 0.46);
        --accent: #7120d1;
        --accent-2: #a255fd;
        background: var(--bg);
        color: var(--fg);
        font-family: var(--font-geist-sans), system-ui, sans-serif;
        min-height: 100vh;
      }
      .proposal-web .display {
        font-family: var(--font-display), Georgia, serif;
      }
      .proposal-web .font-mono {
        font-family: var(--font-geist-mono), ui-monospace, monospace;
      }
      .proposal-web .check {
        color: var(--accent-2);
        font-weight: 600;
      }

      /* Capa */
      .proposal-web .cover {
        background:
          radial-gradient(120% 80% at 80% -10%, rgba(113, 32, 209, 0.28), transparent 60%),
          radial-gradient(80% 60% at 0% 110%, rgba(162, 85, 253, 0.16), transparent 55%),
          var(--bg);
      }
      .proposal-web .cover-glow {
        position: absolute;
        inset: 0;
        background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        background-size: 28px 28px;
        mask-image: radial-gradient(70% 70% at 50% 40%, #000 30%, transparent 100%);
        pointer-events: none;
      }
      .proposal-web .invest-card {
        position: relative;
        background: var(--surface);
        border: 1px solid var(--line);
      }
      .proposal-web .invest-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(70% 120% at 85% 0%, rgba(113, 32, 209, 0.25), transparent 60%);
        pointer-events: none;
      }
      .proposal-web .invest-total {
        background: linear-gradient(180deg, #fff 30%, var(--accent-2));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
      .proposal-web .cta {
        background: var(--surface);
        border: 1px solid var(--line);
      }
      .proposal-web .cta-glow {
        position: absolute;
        inset: 0;
        background: radial-gradient(60% 100% at 50% 0%, rgba(162, 85, 253, 0.22), transparent 65%);
        pointer-events: none;
      }
      .proposal-web .whatsapp-btn {
        background: #25d366;
        color: #fff;
        box-shadow:
          0 0 0 1px rgba(37, 211, 102, 0.3),
          0 8px 32px rgba(37, 211, 102, 0.28);
        letter-spacing: 0.01em;
      }
      .proposal-web .whatsapp-btn:hover {
        background: #20c05c;
        box-shadow:
          0 0 0 1px rgba(37, 211, 102, 0.5),
          0 12px 40px rgba(37, 211, 102, 0.4);
      }

      /* Reveal */
      .proposal-web .reveal {
        opacity: 0;
        transform: translateY(22px);
        transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .proposal-web .reveal-in {
        opacity: 1;
        transform: none;
      }

      /* Entrada da capa */
      .proposal-web .cover-eyebrow,
      .proposal-web .cover-title,
      .proposal-web .cover-sub,
      .proposal-web .cover-meta {
        animation: cover-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .proposal-web .cover-title {
        animation-delay: 0.1s;
      }
      .proposal-web .cover-sub {
        animation-delay: 0.24s;
      }
      .proposal-web .cover-meta {
        animation-delay: 0.36s;
      }
      @keyframes cover-rise {
        from {
          opacity: 0;
          transform: translateY(26px);
        }
        to {
          opacity: 1;
          transform: none;
        }
      }
      .proposal-web .scroll-line {
        transform-origin: top;
        animation: scroll-pulse 1.8s ease-in-out infinite;
      }
      @keyframes scroll-pulse {
        0%,
        100% {
          transform: scaleY(0.4);
          opacity: 0.4;
        }
        50% {
          transform: scaleY(1);
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .proposal-web .reveal,
        .proposal-web .cover-eyebrow,
        .proposal-web .cover-title,
        .proposal-web .cover-sub,
        .proposal-web .cover-meta,
        .proposal-web .scroll-line {
          animation: none !important;
          transition: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  )
}
