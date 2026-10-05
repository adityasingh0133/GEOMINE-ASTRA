'use client'

import { ClipboardCheck, Database, FileStack, FileText, Gauge, Timer } from 'lucide-react'
import { useAppState } from '@/lib/app-state'

export function KpiGrid() {
  const { documents, fields, pendingTotal, reportsGenerated, queries } = useAppState()
  const averageConfidence = fields.length
    ? `${(fields.reduce((total, field) => total + field.confidence, 0) / fields.length).toFixed(1)}%`
    : 'No Data'
  const averageQueryResponse = queries.length
    ? `${(queries.reduce((total, query) => total + query.durationMs, 0) / queries.length / 1000).toFixed(2)}s`
    : 'No Data'
  const highPriority = fields.filter((field) => field.priority === 'high' && field.status === 'needs_review').length
  const kpis = [
    { label: 'Documents Processed', value: String(documents.length), delta: 'Current workspace', icon: FileStack },
    { label: 'Fields Extracted', value: String(fields.length), delta: 'Across current documents', icon: Database },
    { label: 'Average Confidence', value: averageConfidence, delta: fields.length ? 'Current extracted fields' : 'No confidence data', icon: Gauge, accent: 'text-success' },
    { label: 'Pending Verification', value: String(pendingTotal), delta: `${highPriority} high priority`, icon: ClipboardCheck, accent: 'text-warning' },
    { label: 'Reports Generated', value: String(reportsGenerated), delta: 'Current session', icon: FileText },
    { label: 'Avg Query Response', value: averageQueryResponse, delta: queries.length ? `Across ${queries.length} queries` : 'No query history', icon: Timer },
  ]

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((k) => (
        <div key={k.label} className="flex flex-col gap-3 bg-card p-4 transition-colors hover:bg-accent/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{k.label}</span>
            <k.icon className="size-4 text-muted-foreground/70" aria-hidden="true" />
          </div>
          <span className={`font-mono text-2xl font-semibold tabular-nums tracking-tight ${k.accent ?? 'text-foreground'}`}>
            {k.value}
          </span>
          <span className="text-[11px] text-muted-foreground">{k.delta}</span>
        </div>
      ))}
    </div>
  )
}
