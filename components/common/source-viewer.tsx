'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ConfidenceValue, SourceExcerpt } from './indicators'

type Viewable = {
  docName: string
  page: number
  confidence: number
  method?: string
  snippet: { before: string; match: string; after: string }
}

export function SourceViewer({
  field,
  open,
  onOpenChange,
}: {
  field: Viewable | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 sm:max-w-2xl">
        {field && (
          <>
            <DialogHeader className="border-b border-border p-5">
              <DialogTitle className="pr-8 text-base">{field.docName}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-3">
                <span className="font-mono">Page {field.page}</span>
                {field.method && <span>{field.method}</span>}
                <ConfidenceValue value={field.confidence} />
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto bg-background/60 p-5">
              <div className="mx-auto rounded-sm bg-[oklch(0.97_0.005_90)] px-8 py-8 text-[oklch(0.25_0.01_260)] shadow-xl">
                <div className="flex items-center justify-between border-b border-[oklch(0.8_0.01_260)] pb-2 font-mono text-[10px] uppercase tracking-wider text-[oklch(0.45_0.01_260)]">
                  <span>{field.docName}</span>
                  <span>{field.page}</span>
                </div>
                <div className="mt-5 flex flex-col gap-3" aria-hidden="true">
                  <div className="h-2 w-11/12 rounded bg-[oklch(0.85_0.005_260)]" />
                  <div className="h-2 w-full rounded bg-[oklch(0.85_0.005_260)]" />
                  <div className="h-2 w-4/5 rounded bg-[oklch(0.85_0.005_260)]" />
                </div>
                <div className="my-5 rounded border-l-4 border-[oklch(0.7_0.14_215)] bg-[oklch(0.93_0.03_215)] px-4 py-3">
                  <SourceExcerpt {...field.snippet} className="text-[oklch(0.3_0.01_260)]" />
                </div>
                <div className="flex flex-col gap-3" aria-hidden="true">
                  <div className="h-2 w-full rounded bg-[oklch(0.85_0.005_260)]" />
                  <div className="h-2 w-3/4 rounded bg-[oklch(0.85_0.005_260)]" />
                  <div className="h-2 w-11/12 rounded bg-[oklch(0.85_0.005_260)]" />
                  <div className="h-2 w-2/3 rounded bg-[oklch(0.85_0.005_260)]" />
                </div>
              </div>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Simulated page render · Extracted region highlighted
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
