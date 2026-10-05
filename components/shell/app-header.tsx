'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, ChevronDown, LogOut, Menu, Search, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarNav } from './app-sidebar'
import { useAppState } from '@/lib/app-state'
import { deriveComplianceFindings } from '@/lib/document-processing'

export function AppHeader() {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { pendingTotal, fields, profilePicture, profile, logout } = useAppState()
  const findings = deriveComplianceFindings(fields)
  const notifications = [
    ...findings.map((finding) => ({
      title: `Above-limit measurement: ${finding.field}`,
      meta: `${finding.docName} · ${finding.observed} ${finding.unit} vs ${finding.limit} ${finding.unit}`,
    })),
    ...fields
      .filter((field) => field.status === 'needs_review')
      .map((field) => ({ title: `Verification needed: ${field.field}`, meta: field.docName })),
  ].slice(0, 8)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/query?q=${encodeURIComponent(query.trim())}`)
    setQuery('')
  }

  return (
    <header className="glass sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
      >
        <Menu />
      </Button>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="hidden items-center gap-2 md:flex">
        <span className="text-xs text-muted-foreground">Government of India</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs text-muted-foreground">Ministry of Coal</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs font-medium text-foreground">CMPDI · CIL</span>
        <span className="ml-2 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-primary">
          PROTOTYPE
        </span>
      </div>

      <form onSubmit={submit} className="ml-auto flex w-full max-w-sm items-center" role="search">
        <label htmlFor="global-search" className="sr-only">
          Search documents or ask a question
        </label>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="global-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask or search the corpus…"
            className="h-9 w-full rounded-md border border-input bg-background/60 pl-9 pr-14 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            Enter
          </kbd>
        </div>
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />}
        >
          <Bell />
          {(pendingTotal > 0 || findings.length > 0) && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-warning ring-2 ring-background" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Notifications</div>
          {notifications.map((n, index) => (
            <DropdownMenuItem key={`${n.title}-${index}`} className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-sm">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.meta}</span>
            </DropdownMenuItem>
          ))}
          {notifications.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No notifications.</p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" className="h-9 gap-2 px-2" aria-label="Account menu" />}
        >
          <span className="flex size-7 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-primary/15 text-[11px] font-semibold text-primary">
            {profilePicture
              ? <img src={profilePicture} alt="" className="size-full object-cover" />
              : profile?.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-xs font-medium">{profile?.name}</span>
            <span className="text-[10px] text-muted-foreground">{profile?.department}</span>
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => router.push('/settings')}>
            <UserRound /> Profile & Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => {
            try {
              await logout()
              router.push('/')
            } catch (error) {
              toast.error('Could not sign out.', {
                description: error instanceof Error ? error.message : String(error),
              })
            }
          }}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
