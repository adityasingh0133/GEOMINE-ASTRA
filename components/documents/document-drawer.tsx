'use client'

import Link from 'next/link'
import { ArrowRight, Clock, FileType2, Globe2, Layers, ScanText, Table2 } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DocumentRecord } from '@/lib/data'
import { useAppState } from '@/lib/app-state'
import { ConfidenceBar, ConfidenceValue, StatusBadge } from '@/components/common/indicators'
import { DocumentPreview } from './document-preview'

export function DocumentDrawer({
  doc,
  onOpenChange,
}: {
  doc: DocumentRecord | null
  onOpenChange: (open: boolean) => void
}) {
  const { fields } = useAppState()
  const docFields = doc ? fields.filter((f) => f.docId === doc.id) : []

  return (
    <Sheet open={Boolean(doc)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
      >
        {doc && (
          <>
            <SheetHeader className="border-b border-border p-5">
              <div className="flex items-center gap-2">
                <StatusBadge status={doc.status} />
                <span className="font-mono text-[11px] text-muted-foreground">{doc.fileName}</span>
              </div>
              <SheetTitle className="text-pretty pr-8 text-lg leading-snug">{doc.name}</SheetTitle>
              <SheetDescription>Document metadata, extraction quality and recovered structure</SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 p-5">
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
                {[
                  { icon: Globe2, k: 'Source', v: doc.source },
                  { icon: FileType2, k: 'Format', v: `${doc.format} · ${doc.language}` },
                  { icon: Layers, k: 'Pages', v: doc.pages || '—' },
                  { icon: Clock, k: 'Processing time', v: doc.processingTime },
                  { icon: Table2, k: 'Tables detected', v: doc.status === 'uploaded' ? '—' : doc.tables },
                  { icon: ScanText, k: 'Extracted fields', v: doc.fields.toLocaleString('en-IN') },
                ].map((m) => (
                  <div key={m.k} className="flex flex-col gap-1 bg-card p-3">
                    <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <m.icon className="size-3" aria-hidden="true" /> {m.k}
                    </dt>
                    <dd className="text-sm font-medium">{m.v}</dd>
                  </div>
                ))}
              </dl>

              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extraction quality</h3>
                {doc.status === 'processing' || doc.status === 'uploaded' ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No extraction results are available.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {[
                      ['Text extraction confidence', doc.ocr],
                      ['Table extraction accuracy', doc.tableAccuracy],
                      ['Overall confidence', doc.confidence],
                    ].map(([label, v]) => (
                      <div key={label as string} className="grid grid-cols-[160px_1fr] items-center gap-3">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <ConfidenceBar value={v as number} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page preview</h3>
                <DocumentPreview doc={doc} />
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key extracted fields
                  </h3>
                  <span className="text-[11px] text-muted-foreground">{docFields.length} shown</span>
                </div>
                {docFields.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No key fields have been promoted from this document yet.
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
                    {docFields.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{f.field}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">p.{f.page} · {f.method}</p>
                        </div>
                        <span className="font-mono text-sm font-semibold">{f.value}</span>
                        <ConfidenceValue value={f.confidence} />
                        <StatusBadge status={f.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <Link href="/provenance" className={cn(buttonVariants(), 'h-9 w-full')}>
                Open in Confidence & Provenance <ArrowRight />
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
