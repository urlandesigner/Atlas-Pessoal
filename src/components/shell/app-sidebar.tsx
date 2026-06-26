"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FolderOpen,
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  Database,
  Briefcase,
  Sparkles,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const projetosNav = [
  { label: "Pessoal", href: "/projects/pessoal", icon: FolderOpen },
  { label: "Clientes", href: "/projects/clientes", icon: Briefcase },
]

const pessoalNav = [
  { label: "Leads", href: "/crm", icon: TrendingUp },
  { label: "Propostas", href: "/freelancer/proposals", icon: FileText },
  { label: "Clientes", href: "/freelancer/clients", icon: Users },
  { label: "Financeiro", href: "/freelancer/revenue", icon: DollarSign },
]

const ferramentasNav = [
  { label: "Site Factory", href: "/site-factory", icon: Sparkles },
]

type NavItem = { label: string; href: string; icon: React.ElementType }

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              render={<Link href={item.href} />}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background text-xs font-bold tracking-tight">A</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">Atlas Pessoal</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Projetos" items={projetosNav} pathname={pathname} />
        <NavGroup label="Pessoal" items={pessoalNav} pathname={pathname} />
        <NavGroup label="Ferramentas" items={ferramentasNav} pathname={pathname} />
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/backup" />}
                isActive={pathname.startsWith("/backup")}
              >
                <Database />
                <span>Backup</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-muted-foreground">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">Usuário</p>
            <p className="text-xs text-muted-foreground truncate">urlan87@gmail.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
