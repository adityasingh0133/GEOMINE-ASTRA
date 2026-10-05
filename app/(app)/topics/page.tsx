import { PageHeader } from '@/components/common/page-header'
import { TopicsWorkspace } from '@/components/topics/topics-workspace'

export default function TopicsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Topic Analysis"
        title="Topic Discovery Engine"
        description="Automatically identify themes and trends across mining documents."
      />
      <TopicsWorkspace />
    </div>
  )
}
