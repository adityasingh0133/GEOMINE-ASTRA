import type { DocumentRecord } from '@/lib/data'

export function DocumentPreview({ doc }: { doc: DocumentRecord }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-md border border-dashed border-border bg-background/40 p-5 text-center text-sm text-muted-foreground">
      No page preview is available for {doc.fileName}.
    </div>
  )
}
