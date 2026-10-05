'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowRight, Check, Eye, FileText, Hash, Info, Lock, ScanText, SlidersHorizontal, X } from 'lucide-react'
import { SourceViewer } from '@/components/common/source-viewer'
import { Slider } from '@/components/ui/slider'
import { Button, buttonVariants } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppState } from '@/lib/app-state'
import { cn } from '@/lib/utils'
import { ConfidenceBar, ConfidenceValue, SourceExcerpt, StatusBadge } from '@/components/common/indicators'

type FilterKey = 'all' | 'high' | 'review' | 'verified'
const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High Confidence' },
  { key: 'review', label: 'Needs Review' },
  { key: 'verified', label: 'Verified' },
]

export function ProvenanceWorkspace() {
  const { fields, threshold, setThreshold, setFieldStatus } = useAppState()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = fields.find((f) => f.id === selectedId) ?? fields[0] ?? null

  const verified = fields.filter((f) => f.status === 'verified').length
  const review = fields.filter((f) => f.status === 'needs_review').length
  const rejected = fields.filter((f) => f.status === 'rejected').length

  const [filter, setFilter] = useState<FilterKey>('all')
  const [sourceOpen, setSourceOpen] = useState(false)
  const visible = fields.filter((f) => {
    if (filter === 'high') return f.confidence >= 90
    if (filter === 'review') return f.status === 'needs_review'
    if (filter === 'verified') return f.status === 'verified'
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="threshold" className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal className="size-4 text-primary" aria-hidden="true" />
              Confidence threshold
            </label>
            <span className="font-mono text-lg font-semibold tabular-nums text-primary">{threshold}%</span>
          </div>
          <Slider
            id="threshold"
            aria-label="Confidence threshold"
            min={50}
            max={99}
            step={1}
            value={[threshold]}
            onValueChange={(v) => setThreshold(Array.isArray(v) ? v[0] : (v as number))}
          />
          <p className="text-xs text-muted-foreground">
            Fields below the threshold are automatically routed to human verification. Manually reviewed fields keep their decision.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border md:w-96">
          {[
            { label: 'Auto-verified', v: verified, c: 'text-success' },
            { label: 'Needs review', v: review, c: 'text-warning' },
            { label: 'Rejected', v: rejected, c: 'text-destructive' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1 bg-background/60 p-3">
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
              <span className={cn('font-mono text-xl font-semibold tabular-nums', s.c)}>{s.v}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="fields-title">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="fields-title" className="text-sm font-semibold">Extracted fields</h2>
              <p className="text-xs text-muted-foreground">Every value carries a confidence score, source document and page reference</p>
            </div>
            <div role="group" aria-label="Filter fields" className="inline-flex rounded-md border border-border bg-background/50 p-0.5">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={filter === f.key}
                  className={cn(
                    'h-7 rounded px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
                    filter === f.key && 'bg-secondary text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Field</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="w-40">Confidence</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
                <TableHead className="text-right">Page</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No extracted document fields are available.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((f) => (
                <TableRow
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  data-state={f.id === selectedId ? 'selected' : undefined}
                  className={cn('cursor-pointer', f.id === selectedId && 'bg-primary/5 hover:bg-primary/10')}
                >
                  <TableCell className="pl-5 font-medium">
                    <span className="flex items-center gap-2">
                      {f.id === selectedId && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                      {f.field}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">{f.value}</TableCell>
                  <TableCell>
                    <ConfidenceBar value={f.confidence} />
                  </TableCell>
                  <TableCell className="hidden max-w-48 truncate text-muted-foreground md:table-cell">{f.docShort}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{f.page}</TableCell>
                  <TableCell className="pr-5">
                    <StatusBadge status={f.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start" aria-label="Provenance details">
          {selected ? (
            <>
          <div className="rounded-lg border border-primary/30 bg-card p-5 shadow-[0_0_40px_-20px] shadow-primary/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">Provenance record</p>
                <h2 className="mt-1 text-base font-semibold">{selected.field}</h2>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div className="mt-4 flex items-end justify-between rounded-md border border-border bg-background/50 p-4">
              <div>
                <span className="text-[11px] text-muted-foreground">Extracted value</span>
                <p className="font-mono text-3xl font-semibold tracking-tight">{selected.value}</p>
              </div>
              <ConfidenceValue value={selected.confidence} className="text-sm font-semibold" />
            </div>

            <dl className="mt-4 flex flex-col gap-2.5">
              {[
                ['OCR confidence', selected.ocr],
                ['Table extraction', selected.tableAccuracy],
                ['Overall confidence', selected.confidence],
              ].map(([k, v]) => (
                <div key={k as string} className="grid grid-cols-[130px_1fr] items-center gap-3">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd>
                    <ConfidenceBar value={v as number} />
                  </dd>
                </div>
              ))}
            </dl>

            <dl className="mt-5 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <dt className="text-[11px] text-muted-foreground">Source document</dt>
                  <dd>{selected.docName}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <Hash className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Page</dt>
                    <dd className="font-mono">{selected.page}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ScanText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <dt className="text-[11px] text-muted-foreground">Extraction method</dt>
                    <dd>{selected.method}</dd>
                  </div>
                </div>
              </div>
            </dl>

            <div className="mt-5 rounded-md border border-border bg-background/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Source excerpt · p.{selected.page}
                </p>
                <Button variant="ghost" size="sm" className="h-7 text-primary" onClick={() => setSourceOpen(true)}>
                  <Eye /> View Source
                </Button>
              </div>
              <SourceExcerpt {...selected.snippet} />
            </div>

            <p className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Confidence = OCR confidence + table extraction accuracy. Values below {threshold}% are blocked from
                final reports until an officer verifies them.
              </span>
            </p>

            {selected.status !== 'verified' && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <span>Locked from report generation until verified by an authorized officer.</span>
              </div>
            )}

            <SourceViewer field={selected} open={sourceOpen} onOpenChange={setSourceOpen} />

            {selected.reason && (
              <p className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                Flag reason: {selected.reason}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-9 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setFieldStatus(selected.id, 'rejected')
                  toast.error(`Rejected: ${selected.field}`)
                }}
              >
                <X /> Reject
              </Button>
              <Button
                className="h-9 bg-success text-success-foreground hover:bg-success/90"
                onClick={() => {
                  setFieldStatus(selected.id, 'verified')
                  toast.success(`Verified: ${selected.field}`)
                }}
              >
                <Check /> Verify
              </Button>
            </div>
          </div>
          <Link href="/verification" className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}>
            Open Verification Queue <ArrowRight />
          </Link>
            </>
          ) : (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No extracted document data is available.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
