import Link from 'next/link'
import { ArrowRight, Upload } from 'lucide-react'
import { PageHeader } from '@/components/common/page-header'
import { KpiGrid } from '@/components/dashboard/kpi-grid'
import { WorkflowPipeline } from '@/components/dashboard/workflow-pipeline'
import { RecentDocuments, RecentQueries } from '@/components/dashboard/recent-activity'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Executive Overview"
        title="Geological & Mining ASTRA"
        description="Advanced System for Tracking & Reporting Analytics for CMPDI / CIL"
        actions={
          <>
            <Link href="/documents" className={cn(buttonVariants({ variant: 'outline' }), 'h-9')}>
              <Upload /> Ingest Documents
            </Link>
            <Link href="/query" className={cn(buttonVariants(), 'h-9')}>
              Start Query <ArrowRight />
            </Link>
          </>
        }
      />
      <KpiGrid />
      <WorkflowPipeline />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <RecentDocuments />
        <RecentQueries />
      </div>
    </div>
  )
}
