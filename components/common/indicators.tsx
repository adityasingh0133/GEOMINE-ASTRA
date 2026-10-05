import { CheckCircle2, CircleAlert, FileText, Loader2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function confidenceTone(value: number) {
  if (value >= 90) return 'high'
  if (value >= 75) return 'medium'
  return 'low'
}

const toneText = {
  high: 'text-success',
  medium: 'text-warning',
  low: 'text-destructive',
} as const

const toneBg = {
  high: 'bg-success',
  medium: 'bg-warning',
  low: 'bg-destructive',
} as const

export function ConfidenceValue({ value, className }: { value: number; className?: string }) {
  const tone = confidenceTone(value)
  return (
    <span className={cn('inline-flex items-center gap-1.5 font-mono text-xs tabular-nums', toneText[tone], className)}>
      <span className={cn('size-1.5 rounded-full', toneBg[tone])} aria-hidden="true" />
      {value % 1 === 0 ? value : value.toFixed(1)}%
    </span>
  )
}

export function ConfidenceBar({
  value,
  className,
  showLabel = true,
}: {
  value: number
  className?: string
  showLabel?: boolean
}) {
  const tone = confidenceTone(value)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="h-1.5 w-full min-w-12 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Confidence"
      >
        <div className={cn('h-full rounded-full transition-all', toneBg[tone])} style={{ width: `${value}%` }} />
      </div>
      {showLabel && (
        <span className={cn('w-12 shrink-0 text-right font-mono text-xs tabular-nums', toneText[tone])}>
          {value % 1 === 0 ? value : value.toFixed(1)}%
        </span>
      )}
    </div>
  )
}

type Status = 'verified' | 'needs_review' | 'processing' | 'rejected' | 'uploaded'

const statusMap: Record<Status, { label: string; className: string; icon: React.ElementType }> = {
  verified: { label: 'Verified', className: 'border-success/30 bg-success/10 text-success', icon: CheckCircle2 },
  needs_review: { label: 'Needs Review', className: 'border-warning/30 bg-warning/10 text-warning', icon: CircleAlert },
  processing: { label: 'Processing', className: 'border-primary/30 bg-primary/10 text-primary', icon: Loader2 },
  rejected: { label: 'Rejected', className: 'border-destructive/30 bg-destructive/10 text-destructive', icon: XCircle },
  uploaded: { label: 'Uploaded', className: 'border-border bg-muted text-muted-foreground', icon: FileText },
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const s = statusMap[status]
  const Icon = s.icon
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-md border px-2 text-xs font-medium',
        s.className,
        className,
      )}
    >
      <Icon className={cn('size-3', status === 'processing' && 'animate-spin')} aria-hidden="true" />
      {s.label}
    </span>
  )
}

export function SourceExcerpt({
  before,
  match,
  after,
  className,
}: {
  before: string
  match: string
  after: string
  className?: string
}) {
  return (
    <p className={cn('font-serif text-sm leading-relaxed text-muted-foreground', className)}>
      {before}
      <mark className="highlight-mark font-semibold">{match}</mark>
      {after}
    </p>
  )
}
