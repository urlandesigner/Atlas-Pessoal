import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AtlasStorageProvider } from "@/components/persistence/atlas-storage-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Atlas",
  description: "Seu sistema pessoal de registro profissional e impacto.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full" suppressHydrationWarning>
        <TooltipProvider>
          <AtlasStorageProvider>
            {children}
          </AtlasStorageProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
