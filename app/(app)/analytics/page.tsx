import { PageHeader } from '@/components/common/page-header'
import { AnalyticsCharts } from '@/components/analytics/analytics-charts'

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Performance"
        title="Analytics"
        description="Processing throughput, extraction quality and verification outcomes."
      />
      <AnalyticsCharts />
    </div>
  )
}
