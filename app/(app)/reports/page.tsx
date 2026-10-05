import { PageHeader } from '@/components/common/page-header'
import { ReportGenerator } from '@/components/reports/report-generator'

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Report Generation"
        title="Automated Report Generator"
        description="Generate structured reports and Parliamentary Question responses."
      />
      <ReportGenerator />
    </div>
  )
}
