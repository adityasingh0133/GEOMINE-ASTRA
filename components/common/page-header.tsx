export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-1.5">
        {eyebrow && (
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</span>
        )}
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h1>
        <p className="max-w-2xl text-pretty text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
