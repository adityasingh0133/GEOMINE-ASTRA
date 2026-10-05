'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { useAppState } from '@/lib/app-state'
import { cn } from '@/lib/utils'

const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const topicColor = (name: string) => palette[Math.max(0, topics.findIndex((t) => t.name === name)) % palette.length]

const chartConfig = { docs: { label: 'Documents', color: 'var(--chart-1)' } } satisfies ChartConfig

export function TopicsWorkspace() {
  const { documents, fields } = useAppState()
  const [docType, setDocType] = useState('All')
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const docTypes = ['All', ...new Set(documents.map((document) => document.type))]
  const topicRules = [
    { name: 'Environment', terms: ['water', 'dust', 'environment', 'discharge', 'emission'] },
    { name: 'Safety', terms: ['safety', 'incident', 'highwall', 'training', 'drill'] },
    { name: 'Compliance', terms: ['compliance', 'permit', 'limit', 'inspection', 'corrective'] },
    { name: 'Operations', terms: ['production', 'equipment', 'operation', 'movement', 'inspection'] },
    { name: 'Reporting', terms: ['report', 'quarter', 'date', 'roster', 'completion'] },
  ]
  const topics = topicRules.flatMap((rule) => {
    const related = fields.filter((field) => {
      const searchable = `${field.field} ${field.value}`.toLowerCase()
      return (docType === 'All' || documents.find((document) => document.id === field.docId)?.type === docType)
        && rule.terms.some((term) => searchable.includes(term))
    })
    const typedDocuments = new Set(related.map((field) => field.docId))
    if (typedDocuments.size === 0) return []
    const averageConfidence = related.length
      ? Math.round(related.reduce((total, field) => total + field.confidence, 0) / related.length)
      : 0
    return [{ name: rule.name, relevance: averageConfidence, docs: typedDocuments.size, trend: 0, weight: related.length }]
  })
  const counts = new Map<string, { count: number; topic: string }>()
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'was', 'were', 'per', 'of', 'at', 'in', 'to', 'a', 'an'])
  for (const field of fields) {
    const words = `${field.field} ${field.value}`.toLowerCase().match(/[a-z]{4,}/g) ?? []
    for (const word of new Set(words.filter((item) => !stopWords.has(item)))) {
      const topic = topicRules.find((rule) => rule.terms.some((term) => word.includes(term) || term.includes(word)))?.name ?? 'Other'
      const current = counts.get(word) ?? { count: 0, topic }
      counts.set(word, { ...current, count: current.count + 1 })
    }
  }
  const maxWordCount = Math.max(1, ...Array.from(counts.values(), ({ count }) => count))
  const cloudWords = Array.from(counts.entries())
    .sort((left, right) => right[1].count - left[1].count)
    .slice(0, 24)
    .map(([text, word]) => ({ text, topic: word.topic, weight: Math.round(word.count / maxWordCount * 100) }))

  const distribution = topics.map((t) => ({
    topic: t.name,
    docs: t.docs,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Filter by document type" className="flex flex-wrap gap-2">
        {docTypes.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={docType === t}
            onClick={() => setDocType(t)}
            className={cn(
              'h-8 rounded-full border border-border px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground',
              docType === t && 'border-primary/50 bg-primary/10 text-primary',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="rounded-lg border border-border bg-card" aria-labelledby="cloud-title">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 id="cloud-title" className="text-sm font-semibold">Topic landscape</h2>
            <span className="text-xs text-muted-foreground">Select a term to focus</span>
          </div>
          <div className="flex min-h-80 flex-wrap items-center justify-center gap-x-5 gap-y-3 p-8">
            {cloudWords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No document topics have been detected.</p>
            ) : cloudWords.map((w) => {
              const dim = activeTopic && activeTopic !== w.topic
              return (
                <button
                  key={w.text}
                  type="button"
                  onClick={() => setActiveTopic(activeTopic === w.topic ? null : w.topic)}
                  className={cn('font-semibold leading-none tracking-tight transition-opacity hover:opacity-100', dim ? 'opacity-20' : 'opacity-90')}
                  style={{ fontSize: `${0.75 + (w.weight / 100) * 1.9}rem`, color: topicColor(w.topic) }}
                >
                  {w.text}
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card" aria-labelledby="dist-title">
          <div className="border-b border-border px-5 py-3">
            <h2 id="dist-title" className="text-sm font-semibold">Topic distribution</h2>
            <p className="text-xs text-muted-foreground">{docType === 'All' ? 'All document types' : docType}</p>
          </div>
          <div className="p-4">
            {distribution.length === 0 ? (
              <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">No topic statistics are available.</div>
            ) : (
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <BarChart data={distribution} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="topic" tickLine={false} axisLine={false} fontSize={11} width={140} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="docs" radius={3}>
                  {distribution.map((d) => (
                    <Cell
                      key={d.topic}
                      fill={topicColor(d.topic)}
                      fillOpacity={activeTopic && activeTopic !== d.topic ? 0.2 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            )}
          </div>
        </section>
      </div>

      <section aria-labelledby="topics-title" className="flex flex-col gap-3">
        <h2 id="topics-title" className="text-sm font-semibold">Detected topics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          {topics.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3 2xl:col-span-5">
            No topics have been extracted from the current documents.
          </p>
          ) : topics.map((t) => {
          const count = t.docs
          return (
              <article
                key={t.name}
                className={cn(
                  'flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors',
                  activeTopic === t.name ? 'border-primary/50' : 'border-border',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <span className="size-2 rounded-full" style={{ background: topicColor(t.name) }} aria-hidden="true" />
                    {t.name}
                  </h3>
                  <span className="font-mono text-xs text-muted-foreground">{t.weight} fields</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-2xl font-semibold">{count}</p>
                    <p className="text-[11px] text-muted-foreground">documents</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">{t.relevance}%</p>
                    <p className="text-[11px] text-muted-foreground">avg. confidence</p>
                  </div>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${t.relevance}%`, background: topicColor(t.name) }} />
                </div>
                <Link
                  href={`/query?q=${encodeURIComponent(`What ${t.name.toLowerCase()} findings are in the documents?`)}`}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Search className="size-3" aria-hidden="true" /> Query this topic
                </Link>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
