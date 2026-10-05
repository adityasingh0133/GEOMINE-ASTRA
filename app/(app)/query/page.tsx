import { PageHeader } from '@/components/common/page-header'
import { QueryWorkspace } from '@/components/query/query-workspace'

export default async function QueryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow=" AI Query & Response"
        title="AI Knowledge Query"
        description="Ask questions across verified geological and mining documents."
      />
      <QueryWorkspace initialQuery={q} />
    </div>
  )
}
