import { PageHeader } from '@/components/common/page-header'
import { DocumentsWorkspace } from '@/components/documents/documents-workspace'

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Ingestion & Structure Recovery"
        title="Document Intelligence"
        description="Upload and structure government documents for AI-powered retrieval"
      />
      <DocumentsWorkspace />
    </div>
  )
}
