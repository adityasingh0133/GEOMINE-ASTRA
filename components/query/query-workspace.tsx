'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowUp,
  BookOpen,
  CheckCheck,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Button, buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { matchQuery, productionTrend, type QueryAnswer, type Source } from '@/lib/data'
import { useAppState } from '@/lib/app-state'
import { cn } from '@/lib/utils'
import { ConfidenceBar, ConfidenceValue, SourceExcerpt } from '@/components/common/indicators'
import { SourceViewer } from '@/components/common/source-viewer'

type Turn = { id: number; answer: QueryAnswer; loading: boolean }

const pipelineSteps = ['Retrieving indexed passages', 'Filtering by confidence', 'Tracing source pages', 'Composing answer']

const trendConfig = {
  production: { label: 'Production (MT)', color: 'var(--chart-1)' },
  dispatch: { label: 'Dispatch (MT)', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function QueryWorkspace({ initialQuery }: { initialQuery?: string }) {
  const { documents, fields, getStatus, recordQuery, resetVersion } = useAppState()
  const [input, setInput] = useState('')
  const [turns, setTurns] = useState<Turn[]>(() =>
    initialQuery ? [{ id: 1, answer: matchQuery(initialQuery, documents, fields), loading: false }] : [],
  )
  const [activeId, setActiveId] = useState<number | null>(initialQuery ? 1 : null)
  const [viewing, setViewing] = useState<Source | null>(null)
  const nextId = useRef(initialQuery ? 2 : 1)
  const resetVersionRef = useRef(resetVersion)
  const initialQueryRecorded = useRef(false)
  const evidenceRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (resetVersionRef.current !== resetVersion) {
      resetVersionRef.current = resetVersion
      setTurns([])
      setActiveId(null)
      setInput('')
      setViewing(null)
      nextId.current = 1
    }
  }, [resetVersion])

  useEffect(() => {
    if (!initialQuery || initialQueryRecorded.current) return
    initialQueryRecorded.current = true
    recordQuery(matchQuery(initialQuery, documents, fields), 0)
  }, [documents, fields, initialQuery, recordQuery])

  const suggestedQueries = fields.slice(0, 3).map((field) => `What is the ${field.field}?`)
  const busy = turns.some((t) => t.loading)
  const active = turns.find((t) => t.id === activeId && !t.loading)

  function ask(question: string) {
    const q = question.trim()
    if (!q || busy) return
    const id = nextId.current++
    const startedAt = performance.now()
    const answer = matchQuery(q, documents, fields)
    const activeResetVersion = resetVersion
    setTurns((prev) => [...prev, { id, answer, loading: true }])
    setInput('')
    setTimeout(() => {
      if (resetVersionRef.current !== activeResetVersion) return
      setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, loading: false } : t)))
      setActiveId(id)
      recordQuery(answer, performance.now() - startedAt)
    }, 350)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <section className="flex min-h-[600px] flex-col overflow-hidden rounded-lg border border-border bg-card" aria-label="Query conversation">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            Knowledge Query
          </div>
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="size-3 text-success" aria-hidden="true" />
            {documents.length} documents indexed
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5" aria-live="polite">
          {turns.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                <BookOpen className="size-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex max-w-md flex-col gap-1.5">
                <h2 className="text-lg font-semibold">Ask across uploaded documents</h2>
                <p className="text-sm text-muted-foreground">
                  Answers are grounded in extracted fields with confidence scores and page-level source references.
                </p>
              </div>
              <div className="flex w-full max-w-xl flex-col gap-2">
                {suggestedQueries.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/40 px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    {q}
                    <ArrowUp className="size-3.5 shrink-0 rotate-45" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t) => (
            <article key={t.id} className="flex flex-col gap-3">
              <div className="flex items-start gap-3 self-end">
                <p className="max-w-xl rounded-lg rounded-tr-sm bg-secondary px-4 py-2.5 text-sm">{t.answer.question}</p>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted" aria-hidden="true">
                  <User className="size-3.5" />
                </span>
              </div>

              {t.loading ? (
                <LoadingAnswer />
              ) : (
                <AnswerCard
                  answer={t.answer}
                  active={t.id === activeId}
                  pending={t.answer.fieldIds.filter((id) => getStatus(id) !== 'verified').length}
                  onSelect={() => setActiveId(t.id)}
                  onViewSources={() => {
                    setActiveId(t.id)
                    evidenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                />
              )}
            </article>
          ))}
        </div>

        <form
          className="border-t border-border p-4"
          onSubmit={(e) => {
            e.preventDefault()
            ask(input)
          }}
        >
          {turns.length > 0 && (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {suggestedQueries.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={busy}
                  onClick={() => ask(q)}
                  className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-lg border border-border bg-background/60 p-2 focus-within:border-primary/50">
            <label htmlFor="query-input" className="sr-only">
              Ask a question
            </label>
            <Textarea
              id="query-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  if (e.nativeEvent.isComposing || e.keyCode === 229) return
                  e.preventDefault()
                  ask(input)
                }
              }}
              rows={2}
              placeholder="Ask a question about production, dispatch, mining operations, reports or parliamentary queries..."
              className="min-h-0 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || busy} aria-label="Submit question">
              {busy ? <Loader2 className="animate-spin" /> : <ArrowUp />}
            </Button>
          </div>
        </form>
      </section>

      <aside ref={evidenceRef} className="flex flex-col gap-4 xl:sticky xl:top-24 xl:self-start" aria-label="Source evidence">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Source Evidence</h2>
            {active && <span className="font-mono text-xs text-muted-foreground">{active.answer.sources.length} sources</span>}
          </div>
          <div className="flex flex-col gap-3 p-4">
            {!active && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {busy ? 'Tracing sources…' : 'Ask a question to see the evidence behind the answer.'}
              </p>
            )}
            {active?.answer.noEvidence && (
              <p className="py-10 text-center text-sm text-muted-foreground">No indexed source evidence is available yet.</p>
            )}
            {active?.answer.sources.map((s, i) => (
              <div key={`${s.docName}-${s.page}-${i}`} className="flex flex-col gap-3 rounded-md border border-border bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/15 font-mono text-[10px] text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium leading-snug">{s.docName}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">Page {s.page}</p>
                    </div>
                  </div>
                  <ConfidenceValue value={s.confidence} />
                </div>
                <SourceExcerpt {...s.excerpt} className="text-[13px]" />
                <div className="flex items-center justify-between gap-3">
                  <ConfidenceBar value={s.confidence} showLabel={false} className="max-w-32" />
                  <Button variant="ghost" size="sm" className="h-7 text-primary" onClick={() => setViewing(s)}>
                    View Source
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {active?.answer.showTrend && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Production vs Dispatch (MT)</h3>
            <ChartContainer config={trendConfig} className="h-48 w-full">
              <BarChart data={productionTrend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={30} domain={[60, 90]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="production" fill="var(--color-production)" radius={3} />
                <Bar dataKey="dispatch" fill="var(--color-dispatch)" radius={3} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </aside>

      <SourceViewer
        field={viewing && { docName: viewing.docName, page: viewing.page, confidence: viewing.confidence, snippet: viewing.excerpt }}
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
      />
    </div>
  )
}

function LoadingAnswer() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/40 p-5">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {pipelineSteps.map((s, i) => (
          <span
            key={s}
            className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            <Loader2 className="size-3 animate-spin text-primary" aria-hidden="true" /> {s}
          </span>
        ))}
      </div>
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

function AnswerCard({
  answer,
  active,
  pending,
  onSelect,
  onViewSources,
}: {
  answer: QueryAnswer
  active: boolean
  pending: number
  onSelect: () => void
  onViewSources: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-4 rounded-lg border bg-background/40 p-5 transition-colors',
        active ? 'border-primary/40 shadow-[0_0_40px_-24px] shadow-primary' : 'border-border',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" /> AI Answer
        </span>
        {!answer.noEvidence && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            Confidence <ConfidenceValue value={answer.confidence} className="text-sm font-semibold" />
          </span>
        )}
      </div>
      <p className="text-pretty text-[15px] leading-relaxed">{answer.answer}</p>

      {!answer.noEvidence && (
        <>
          <div className="flex flex-col gap-1.5 border-t border-border pt-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Sources</span>
            <ul className="flex flex-col gap-1">
              {answer.sources.map((s, i) => (
                <li key={`${s.docName}-${s.page}-${i}`} className="flex items-center gap-2 text-sm">
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{s.docName}</span>
                  <span className="shrink-0 font-mono text-xs text-primary">p.{s.page}</span>
                </li>
              ))}
            </ul>
          </div>

          {pending > 0 ? (
            <div role="alert" className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-warning">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                This answer contains {pending === 1 ? 'a low-confidence extracted field' : `${pending} low-confidence extracted fields`} and
                requires human verification before report generation.
              </span>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-success">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> Answer generated from confidence-tagged documents
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Link href={`/reports?from=${answer.key}`} className={cn(buttonVariants({ size: 'sm' }), 'h-8')}>
              <FileText /> Generate Report
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={(e) => {
                e.stopPropagation()
                onViewSources()
              }}
            >
              <BookOpen /> View Sources
            </Button>
            {pending > 0 ? (
              <Link href="/verification" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 border-warning/40 text-warning')}>
                <CheckCheck /> Verify Answer
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  toast.success('Answer verified', { description: 'All cited fields are verified and traceable.' })
                }}
              >
                <CheckCheck /> Verify Answer
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
