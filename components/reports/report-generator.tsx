'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Download, FileOutput, Loader2, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppState } from '@/lib/app-state'

type Config = { type: string; topic: string; department: string; period: string }

const reportTypes = [
  { label: 'Parliamentary Question Response', value: 'pq' },
  { label: 'Internal Report', value: 'internal' },
]
const departments = [
  { label: 'Ministry of Coal', value: 'Ministry of Coal' },
  { label: 'CMPDI — Planning Division', value: 'CMPDI — Planning Division' },
  { label: 'Coal India Limited', value: 'Coal India Limited' },
]

export function ReportGenerator() {
  const { fields, recordReport, resetVersion } = useAppState()
  const [config, setConfig] = useState<Config>({
    type: 'internal',
    topic: '',
    department: 'Ministry of Coal',
    period: '',
  })
  const [generated, setGenerated] = useState<Config | null>(null)
  const [generating, setGenerating] = useState(false)
  const resetVersionRef = useRef(resetVersion)
  const pending = fields.filter((field) => field.status !== 'verified')

  useEffect(() => {
    if (resetVersionRef.current === resetVersion) return
    resetVersionRef.current = resetVersion
    setGenerated(null)
    setGenerating(false)
  }, [resetVersion])

  function generate() {
    if (fields.length === 0) return
    const activeResetVersion = resetVersion
    const sourceFields = [...fields]
    setGenerating(true)
    setTimeout(() => {
      if (resetVersionRef.current !== activeResetVersion) return
      setGenerated(config)
      setGenerating(false)
      recordReport(config.topic || 'Document findings', [...new Set(sourceFields.map((field) => field.docId))])
      toast.success('Draft generated', { description: 'Extracted values include source references.' })
    }, 350)
  }

  function download() {
    if (!generated || fields.length === 0) return
    const lines = [
      generated.type === 'pq' ? 'PARLIAMENTARY QUESTION RESPONSE — DRAFT' : 'INTERNAL REPORT — DRAFT',
      `Subject: ${generated.topic || 'Document findings'}${generated.period ? ` — ${generated.period}` : ''}`,
      `Department: ${generated.department}`,
      '',
      ...fields.map((field) => {
        const verification = field.status === 'verified' ? '' : ' [PENDING VERIFICATION]'
        return `${field.field}: ${field.value}.${verification} [Source: ${field.docName}, p.${field.page}]`
      }),
      '',
      'AI-assisted draft — requires review by an authorised officer.',
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `draft-${generated.type}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      <section className="flex flex-col gap-5 self-start rounded-lg border border-border bg-card p-5 xl:sticky xl:top-24" aria-labelledby="config-title">
        <div>
          <h2 id="config-title" className="text-sm font-semibold">Report configuration</h2>
          <p className="text-xs text-muted-foreground">Drafts use extracted fields with source references.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Report type</Label>
          <Select items={reportTypes} value={config.type} onValueChange={(value) => value && setConfig({ ...config, type: value })}>
            <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{reportTypes.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="topic">Subject</Label>
          <Input id="topic" value={config.topic} onChange={(event) => setConfig({ ...config, topic: event.target.value })} placeholder="Enter a report subject" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dept">Department</Label>
          <Select items={departments} value={config.department} onValueChange={(value) => value && setConfig({ ...config, department: value })}>
            <SelectTrigger id="dept" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{departments.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="period">Time period</Label>
          <Input id="period" value={config.period} onChange={(event) => setConfig({ ...config, period: event.target.value })} placeholder="Enter a time period" />
        </div>
        <Button onClick={generate} disabled={generating || fields.length === 0} className="h-10">
          {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {generating ? 'Generating draft…' : 'Generate Draft'}
        </Button>
      </section>

      <section className="flex flex-col gap-4" aria-label="Report preview">
        {generated && !generating && fields.length > 0 ? (
          <>
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
              {pending.length > 0 ? (
                <p className="flex items-start gap-2 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {pending.length} figure{pending.length > 1 ? 's' : ''} pending verification.
                </p>
              ) : (
                <p className="flex items-center gap-2 text-sm text-success">
                  <ShieldCheck className="size-4" aria-hidden="true" /> All figures verified and traceable.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-8" onClick={download}><Download /> Download Draft</Button>
                <Button size="sm" className="h-8" onClick={() => toast.success('Draft sent for officer review.')}>
                  <Send /> Send for Approval
                </Button>
              </div>
            </div>
            <article className="mx-auto w-full max-w-3xl rounded-sm bg-[oklch(0.98_0.004_90)] px-6 py-10 font-serif text-[oklch(0.22_0.01_260)] shadow-2xl md:px-14">
              <header className="flex flex-col items-center gap-1 border-b-2 border-[oklch(0.22_0.01_260)] pb-5 text-center">
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.25em] text-[oklch(0.45_0.01_260)]">{generated.department}</p>
                <h3 className="mt-2 text-xl font-semibold">{generated.type === 'pq' ? 'Parliamentary Question Response' : 'Internal Report'}</h3>
                <p className="text-sm">{generated.topic}{generated.period && ` — ${generated.period}`}</p>
              </header>
              <div className="mt-6 flex flex-col gap-4 text-[15px] leading-relaxed">
                {fields.map((field) => (
                  <p key={field.id}>
                    <span className="font-semibold">{field.field}:</span> {field.value}.{' '}
                    {field.status !== 'verified' && <span className="font-sans text-xs font-semibold uppercase">Pending verification. </span>}
                    <span className="font-sans text-xs">[Source: {field.docShort}, p.{field.page}]</span>
                  </p>
                ))}
                <section className="border-t border-[oklch(0.8_0.005_260)] pt-4">
                  <p className="mb-2 font-sans text-[11px] font-semibold uppercase tracking-wider">Source references</p>
                  <ol className="flex list-decimal flex-col gap-1 pl-5 font-sans text-xs">
                    {fields.map((field) => <li key={field.id}>{field.docName}, page {field.page} — {field.field}</li>)}
                  </ol>
                </section>
                <p className="font-sans text-[10px] uppercase tracking-wider">AI-assisted draft · Requires review by an authorised officer</p>
              </div>
            </article>
          </>
        ) : (
          <div className="flex min-h-80 items-center justify-center rounded-lg border border-border bg-background/40 p-8 text-center text-sm text-muted-foreground">
            {fields.length === 0
              ? 'No extracted document data is available. Upload and process a document before generating a report.'
              : 'Configure the report and select Generate Draft to preview it.'}
          </div>
        )}
      </section>
    </div>
  )
}
