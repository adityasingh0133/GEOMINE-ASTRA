import { PageHeader } from '@/components/common/page-header'
import { ProvenanceWorkspace } from '@/components/provenance/provenance-workspace'

export default function ProvenancePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow=" Confidence & Provenance"
        title="Confidence & Provenance Engine"
        description="Every extracted value is traceable to its original source."
      />
      <ProvenanceWorkspace />
    </div>
  )
}
