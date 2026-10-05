'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/shell/app-sidebar'
import { AppHeader } from '@/components/shell/app-header'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppState } from '@/lib/app-state'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { ready, accountEmail } = useAppState()

  useEffect(() => {
    if (ready && !accountEmail) router.replace('/')
  }, [ready, accountEmail, router])

  if (!ready || !accountEmail) return null

  return (
    <TooltipProvider>
      <div className="min-h-dvh">
        <AppSidebar />
        <div className="flex min-h-dvh flex-col lg:pl-64">
          <AppHeader />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}
