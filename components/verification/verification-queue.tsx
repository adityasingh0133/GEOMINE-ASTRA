'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertOctagon, Check, CheckCheck, Clock, Eye, Inbox, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppState } from '@/lib/app-state'
import { cn } from '@/lib/utils'
import { ConfidenceBar, StatusBadge } from '@/components/common/indicators'
import { SourceViewer } from '@/components/common/source-viewer'

const assignees = ['A. Rao', 'S. Mahato', 'R. Tirkey']
type Pending = { id: string; action: 'verified' | 'rejected' } | null
type Tab = 'pending' | 'resolved'

export function VerificationQueue() {
  const { fields, setFieldStatus, pendingTotal, reviewedToday } = useAppState()
  const [confirm, setConfirm] = useState<Pending>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('pending')

  const queue = fields.filter((f) => f.reason || f.manual || f.status !== 'verified')
  const pendingItems = queue.filter((f) => f.status === 'needs_review')
  const resolvedItems = queue.filter((f) => f.status !== 'needs_review')
  const highPriority = pendingItems.filter((field) => field.priority === 'high').length
  const items = tab === 'pending' ? pendingItems : resolvedItems

  const confirmField = confirm && fields.find((f) => f.id === confirm.id)
  const viewing = viewingId ? fields.find((f) => f.id === viewingId) ?? null : null

  const stats = [
    { label: 'Pending Verifications', value: pendingTotal, icon: Clock, tone: 'text-warning' },
    { label: 'High Priority', value: highPriority, icon: AlertOctagon, tone: 'text-destructive' },
    { label: 'Reviewed Today', value: reviewedToday, icon: CheckCheck, tone: 'text-success' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{s.value}</p>
            </div>
            <s.icon className={cn('size-5', s.tone)} aria-hidden="true" />
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card" aria-labelledby="queue-title">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="queue-title" className="text-sm font-semibold">Verification queue</h2>
            <p className="text-xs text-muted-foreground">Fields below the confidence threshold or flagged by extraction</p>
          </div>
          <div role="group" aria-label="Queue view" className="inline-flex rounded-md border border-border bg-background/50 p-0.5">
            {(['pending', 'resolved'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
                className={cn('h-7 rounded px-3 text-xs font-medium capitalize text-muted-foreground', tab === t && 'bg-secondary text-foreground')}
              >
                {t} ({t === 'pending' ? pendingItems.length : resolvedItems.length})
              </button>
            ))}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {tab === 'pending' ? 'No extracted fields are waiting for verification.' : 'No reviewed items yet.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((f, i) => (
              <li key={f.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{f.field}</span>
                    {f.priority === 'high' && f.status === 'needs_review' && (
                      <span className="rounded border border-destructive/40 bg-destructive/10 px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-destructive">
                        High priority
                      </span>
                    )}
                    <StatusBadge status={f.status} />
                  </div>
                  <p className="font-mono text-base font-semibold">{f.value}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {f.docName} · p.{f.page}
                  </p>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  <ConfidenceBar value={f.confidence} className="max-w-48" />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    {f.reason && (
                      <span>
                        Reason: <span className="text-foreground">{f.reason}</span>
                      </span>
                    )}
                    <span>
                      Assigned: <span className="text-foreground">{assignees[i % assignees.length]}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => setViewingId(f.id)}>
                    <Eye /> Review Source
                  </Button>
                  {f.status === 'needs_review' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirm({ id: f.id, action: 'rejected' })}
                      >
                        <X /> Reject
                      </Button>
                      <Button size="sm" className="h-8" onClick={() => setConfirm({ id: f.id, action: 'verified' })}>
                        <Check /> Approve
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setFieldStatus(f.id, 'needs_review')}>
                      Reopen
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          {confirmField && confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirm.action === 'verified' ? 'Approve extracted value?' : 'Reject extracted value?'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmField.field}: <span className="font-mono text-foreground">{confirmField.value}</span> from{' '}
                  {confirmField.docShort}, p.{confirmField.page}.{' '}
                  {confirm.action === 'verified'
                    ? 'Approved values become eligible for report generation.'
                    : 'Rejected values are excluded from answers and reports.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant={confirm.action === 'rejected' ? 'destructive' : 'default'}
                  onClick={() => {
                    setFieldStatus(confirm.id, confirm.action)
                    toast.success(confirm.action === 'verified' ? 'Value approved' : 'Value rejected', {
                      description: `${confirmField.field} · logged to audit trail`,
                    })
                    setConfirm(null)
                  }}
                >
                  {confirm.action === 'verified' ? 'Approve' : 'Reject'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <SourceViewer field={viewing} open={Boolean(viewing)} onOpenChange={(o) => !o && setViewingId(null)} />
    </div>
  )
}
