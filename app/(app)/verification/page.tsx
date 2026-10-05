import { PageHeader } from '@/components/common/page-header'
import { VerificationQueue } from '@/components/verification/verification-queue'

export default function VerificationPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Human-in-the-loop"
        title="Verification Queue"
        description="Review low-confidence extracted information before it is used in reports."
      />
      <VerificationQueue />
    </div>
  )
}
