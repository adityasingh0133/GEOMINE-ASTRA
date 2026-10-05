'use client'

import Link from 'next/link'
import {
  BadgeCheck,
  FileStack,
  FileText,
  Layers,
  MessageSquareText,
  ScanText,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppState } from '@/lib/app-state'

export function WorkflowPipeline() {
  const { documents, fields } = useAppState()
  const pages = documents.reduce((sum, document) => sum + document.pages, 0)
  const tables = documents.reduce((sum, document) => sum + document.tables, 0)
  const stages = [
    { label: 'Documents', meta: `${documents.length} files`, icon: FileStack, href: '/documents' },
    { label: 'OCR & Parsing', meta: `${pages.toLocaleString('en-IN')} pages read`, icon: ScanText, href: '/documents' },
    { label: 'Structure Recovery', meta: `${tables.toLocaleString('en-IN')} tables rebuilt`, icon: Layers, href: '/documents' },
    { label: 'Confidence + Provenance', meta: `${fields.length.toLocaleString('en-IN')} fields traced`, icon: ShieldCheck, href: '/provenance', key: true },
    { label: 'AI Query', meta: 'Retrieval over verified', icon: MessageSquareText, href: '/query' },
    { label: 'Verified Answer', meta: 'Cited, page-linked', icon: BadgeCheck, href: '/query' },
    { label: 'Report', meta: 'Draft for approval', icon: FileText, href: '/reports' },
  ]
  return (
    <section aria-labelledby="pipeline-title" className="grid-bg relative overflow-hidden rounded-lg border border-border bg-card/60 p-5 md:p-6">
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">Intelligence Pipeline</p>
          <h2 id="pipeline-title" className="mt-1 text-lg font-semibold tracking-tight">
            Find → Verify → Answer → Report
          </h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          NCP shows structured KPI numbers. GeoMine makes the documents behind those numbers machine-readable,
          searchable and verifiable.
        </p>
      </div>

      <ol className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-0">
        {stages.map((s, i) => (
          <li key={s.label} className="flex flex-col lg:flex-1 lg:flex-row lg:items-center">
            <Link
              href={s.href}
              className={cn(
                'group relative flex flex-1 items-center gap-3 rounded-md border bg-background/70 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 lg:flex-col lg:items-start lg:gap-2.5',
                s.key ? 'border-primary/50 shadow-[0_0_30px_-10px] shadow-primary/60' : 'border-border',
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-md border',
                    s.key ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border bg-muted text-muted-foreground group-hover:text-primary',
                  )}
                >
                  <s.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium leading-tight">{s.label}</span>
                <span className="mt-0.5 text-[11px] text-muted-foreground">{s.meta}</span>
              </div>
              {s.key && (
                <span className="absolute -top-2 right-2 rounded bg-primary px-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Core
                </span>
              )}
            </Link>
            {i < stages.length - 1 && (
              <span aria-hidden="true" className="mx-auto h-3 w-0.5 bg-primary/40 lg:mx-0 lg:h-0.5 lg:w-4 lg:shrink-0">
                <span className="flow-dash hidden h-full w-full lg:block" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
