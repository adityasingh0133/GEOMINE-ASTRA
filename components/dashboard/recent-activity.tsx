'use client'

import Link from 'next/link'
import { ArrowUpRight, MessageSquareText } from 'lucide-react'
import { ConfidenceValue, StatusBadge } from '@/components/common/indicators'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppState } from '@/lib/app-state'

export function RecentDocuments() {
  const { documents } = useAppState()
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card" aria-labelledby="recent-docs">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 id="recent-docs" className="text-sm font-semibold">Recent Documents</h2>
          <p className="text-xs text-muted-foreground">Latest ingested sources with extraction confidence</p>
        </div>
        <Link href="/documents" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          View all <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="hidden md:table-cell">Source</TableHead>
            <TableHead className="text-right">Pages</TableHead>
            <TableHead className="text-right">Fields</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden pr-5 xl:table-cell">Uploaded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.slice(0, 6).map((d) => (
            <TableRow key={d.id}>
              <TableCell className="max-w-72 pl-5">
                <Link href={`/documents?doc=${d.id}`} className="block truncate font-medium hover:text-primary">
                  {d.name}
                </Link>
                <span className="font-mono text-[11px] text-muted-foreground">{d.format}</span>
              </TableCell>
              <TableCell className="text-muted-foreground">{d.type}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{d.source}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{d.pages}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{d.fields.toLocaleString('en-IN')}</TableCell>
              <TableCell>{d.status === 'processing' ? <span className="text-xs text-muted-foreground">—</span> : <ConfidenceValue value={d.confidence} />}</TableCell>
              <TableCell>
                <StatusBadge status={d.status} />
              </TableCell>
              <TableCell className="hidden pr-5 text-xs text-muted-foreground xl:table-cell">{d.uploaded}</TableCell>
            </TableRow>
          ))}
          {documents.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                No documents have been uploaded.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  )
}

export function RecentQueries() {
  const { queries } = useAppState()
  return (
    <section className="flex flex-col rounded-lg border border-border bg-card" aria-labelledby="recent-queries">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 id="recent-queries" className="text-sm font-semibold">Recent AI Queries</h2>
          <p className="text-xs text-muted-foreground">Answers backed by cited evidence</p>
        </div>
        <Link href="/query" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          Ask <ArrowUpRight className="size-3" />
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {queries.slice(0, 5).map((query) => (
          <li key={query.id}>
            <Link
              href={`/query?q=${encodeURIComponent(query.answer.question)}`}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-accent/50"
            >
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm">{query.answer.question}</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(query.createdAt).toLocaleString()} · {query.answer.sources.length} source{query.answer.sources.length === 1 ? '' : 's'}
                </span>
              </div>
              <ConfidenceValue value={query.answer.confidence} />
            </Link>
          </li>
        ))}
        {queries.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-muted-foreground">No query history yet.</li>
        )}
      </ul>
    </section>
  )
}
