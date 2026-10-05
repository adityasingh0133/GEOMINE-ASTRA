import { PageHeader } from '@/components/common/page-header'
import { SettingsPanel } from '@/components/settings/settings-panel'

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Workspace" title="Settings" description="Confidence policy, profile and notification preferences." />
      <SettingsPanel />
    </div>
  )
}
