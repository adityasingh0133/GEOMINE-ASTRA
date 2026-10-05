'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useAppState } from '@/lib/app-state'
import { deriveComplianceFindings } from '@/lib/document-processing'

function ChartCard({
  title,
  description,
  hasData,
  children,
}: {
  title: string
  description: string
  hasData: boolean
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-4">
        {hasData ? children : <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data available yet.</div>}
      </div>
    </section>
  )
}

const docsConfig = { docs: { label: 'Documents', color: 'var(--chart-1)' } } satisfies ChartConfig
const confConfig = { fields: { label: 'Fields', color: 'var(--chart-2)' } } satisfies ChartConfig
const verifyConfig = {
  approved: { label: 'Approved', color: 'var(--chart-3)' },
  pending: { label: 'Pending', color: 'var(--chart-4)' },
  rejected: { label: 'Rejected', color: 'var(--chart-5)' },
} satisfies ChartConfig
const timeConfig = { seconds: { label: 'Seconds', color: 'var(--chart-1)' } } satisfies ChartConfig

export function AnalyticsCharts() {
  const { documents, fields, queries } = useAppState()
  const processedDocuments = documents.filter((document) => document.status !== 'processing')
  const docsOverTime = processedDocuments.slice().reverse().map((document, index) => ({
    day: document.name.slice(0, 14),
    docs: index + 1,
  }))
  const confidenceDistribution = [
    { bucket: '0–59', fields: fields.filter((field) => field.confidence < 60).length },
    { bucket: '60–79', fields: fields.filter((field) => field.confidence >= 60 && field.confidence < 80).length },
    { bucket: '80–89', fields: fields.filter((field) => field.confidence >= 80 && field.confidence < 90).length },
    { bucket: '90–100', fields: fields.filter((field) => field.confidence >= 90).length },
  ].filter((bucket) => bucket.fields > 0)
  const verificationTrend = fields.length > 0 ? [{
    day: 'Current',
    approved: fields.filter((field) => field.status === 'verified').length,
    pending: fields.filter((field) => field.status === 'needs_review').length,
    rejected: fields.filter((field) => field.status === 'rejected').length,
  }] : []
  const responseTimes = queries.slice(0, 8).reverse().map((query, index) => ({
    run: String(index + 1),
    seconds: Math.round(query.durationMs / 10) / 100,
  }))
  const findings = deriveComplianceFindings(fields)

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3" aria-label="Processing performance">
        <div className="flex flex-col gap-1 bg-card p-5">
          <p className="text-xs text-muted-foreground">Documents processed</p>
          <p className="font-mono text-3xl font-semibold text-foreground">{processedDocuments.length}</p>
        </div>
        <div className="flex flex-col gap-1 bg-card p-5">
          <p className="text-xs text-muted-foreground">Fields extracted</p>
          <p className="font-mono text-3xl font-semibold text-primary">{fields.length}</p>
        </div>
        <div className="flex flex-col gap-1 bg-card p-5">
          <p className="text-xs text-muted-foreground">Compliance findings</p>
          <p className="font-mono text-3xl font-semibold text-warning">{findings.length}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Documents processed" description="Cumulative document count by source" hasData={docsOverTime.length > 0}>
          <ChartContainer config={docsConfig} className="h-64 w-full">
            <AreaChart data={docsOverTime}>
              <defs>
                <linearGradient id="docsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-docs)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-docs)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="docs" type="monotone" stroke="var(--color-docs)" strokeWidth={2} fill="url(#docsFill)" />
            </AreaChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Confidence score distribution" description="Extracted fields by confidence band" hasData={confidenceDistribution.length > 0}>
          <ChartContainer config={confConfig} className="h-64 w-full">
            <BarChart data={confidenceDistribution}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="fields" fill="var(--color-fields)" radius={3} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Verification status" description="Current verified, pending and rejected fields" hasData={verificationTrend.length > 0}>
          <ChartContainer config={verifyConfig} className="h-64 w-full">
            <BarChart data={verificationTrend}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="approved" stackId="v" fill="var(--color-approved)" />
              <Bar dataKey="pending" stackId="v" fill="var(--color-pending)" />
              <Bar dataKey="rejected" stackId="v" fill="var(--color-rejected)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </ChartCard>

        <ChartCard title="Query response time" description="Elapsed time from query submission to result" hasData={responseTimes.length > 0}>
          <ChartContainer config={timeConfig} className="h-64 w-full">
            <LineChart data={responseTimes}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="run" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line dataKey="seconds" type="monotone" stroke="var(--color-seconds)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ChartContainer>
        </ChartCard>
      </div>

      <section className="rounded-lg border border-border bg-card" aria-labelledby="findings-title">
        <div className="border-b border-border px-5 py-3">
          <h2 id="findings-title" className="text-sm font-semibold">Compliance findings</h2>
          <p className="text-xs text-muted-foreground">Measurements compared with limits extracted from the same documents</p>
        </div>
        {findings.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No above-limit findings in the current document corpus.</p>
        ) : (
          <ul className="divide-y divide-border">
            {findings.map((finding) => (
              <li key={`${finding.docName}-${finding.field}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{finding.field}</p>
                  <p className="text-xs text-muted-foreground">{finding.docName}, page {finding.page}</p>
                </div>
                <p className="font-mono text-sm text-warning">
                  {finding.observed} {finding.unit} / limit {finding.limit} {finding.unit} · risk {finding.riskScore}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
