'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  ClipboardCheck,
  Cloud,
  FileStack,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppState } from '@/lib/app-state'
import { LogoMark } from '@/components/common/logo'

export const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, step: null },
  { href: '/documents', label: 'Documents', icon: FileStack, step: 'Find' },
  { href: '/provenance', label: 'Confidence & Provenance', icon: ShieldCheck, step: 'Verify' },
  { href: '/query', label: 'AI Query', icon: MessageSquareText, step: 'Answer' },
  { href: '/reports', label: 'Report Generator', icon: FileText, step: 'Report' },
  { href: '/topics', label: 'Topics & Word Cloud', icon: Cloud, step: null },
  { href: '/verification', label: 'Verification Queue', icon: ClipboardCheck, step: null },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, step: null },
  { href: '/settings', label: 'Settings', icon: Settings, step: null },
] as const

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { pendingTotal } = useAppState()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <LogoMark />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold tracking-tight text-sidebar-accent-foreground">
            GEOMINE-ASTRA
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">CMPDI · CIL</span>
        </div>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        <span className="px-3 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
          Workspace
        </span>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex h-9 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                active && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )}
            >
              {active && (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />
              )}
              <Icon
                className={cn('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
              {item.href === '/verification' && pendingTotal > 0 && (
                <span className="ml-auto rounded bg-warning/15 px-1.5 font-mono text-[10px] text-warning">
                  {pendingTotal}
                </span>
              )}
              {item.step && (
                <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                  {item.step}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/50 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Problem Statement</p>
          <p className="mt-1 text-xs font-medium text-sidebar-accent-foreground">SIH 2026 • PS SIH26023</p>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
      <SidebarNav />
    </aside>
  )
}
