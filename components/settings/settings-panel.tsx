'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useAppState } from '@/lib/app-state'

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 rounded-lg border border-border bg-card p-5 md:grid-cols-[260px_1fr]">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  )
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function SettingsPanel() {
  const {
    threshold,
    setThreshold,
    profilePicture,
    setProfilePicture,
    profile,
    updateProfile,
    preferences,
    setPreference,
  } = useAppState()
  const profilePictureInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(profile?.name ?? '')
  const [department, setDepartment] = useState(profile?.department ?? '')

  useEffect(() => {
    setName(profile?.name ?? '')
    setDepartment(profile?.department ?? '')
  }, [profile?.email, profile?.name, profile?.department])

  function selectProfilePicture(file?: File) {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Choose a JPG, JPEG, or PNG image.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        toast.error('The selected profile picture could not be read.')
        return
      }

      setProfilePicture(reader.result)
      toast.success('Profile picture updated.')
    }
    reader.onerror = () => {
      toast.error('The selected profile picture could not be read.')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title="Confidence policy" description="Fields below the threshold are routed to the verification queue and blocked from final reports.">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="threshold">Auto-verify threshold</Label>
            <span className="font-mono text-sm text-primary">{threshold}%</span>
          </div>
          <Slider
            id="threshold"
            min={60}
            max={98}
            step={1}
            value={[threshold]}
            onValueChange={(v) => setThreshold(Array.isArray(v) ? v[0] : v)}
            aria-label="Auto-verify confidence threshold"
          />
          <p className="text-xs text-muted-foreground">Applied live across Provenance, Verification and Report Generator.</p>
        </div>
        <ToggleRow
          id="block-reports"
          label="Block unverified values in final reports"
          hint="Drafts still show values with a pending marker"
          checked={preferences['block-reports'] ?? true}
          onCheckedChange={(checked) => setPreference('block-reports', checked)}
        />
      </Section>

      <Section title="Profile" description="Displayed on audit trail entries and report sign-off.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 sm:col-span-2">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-primary/15 text-lg font-semibold text-primary">
              {profilePicture
                ? <img src={profilePicture} alt="Profile picture" className="size-full object-cover" />
                : (profile?.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase() ?? '')}
            </span>
            <div className="flex flex-col items-start gap-1.5">
              <input
                ref={profilePictureInput}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                className="sr-only"
                aria-label="Select profile picture"
                onChange={(event) => {
                  selectProfilePicture(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => profilePictureInput.current?.click()}>
                <Camera /> {profilePicture ? 'Change picture' : 'Upload picture'}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, JPEG or PNG</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dept">Department</Label>
            <Input id="dept" value={department} onChange={(event) => setDepartment(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="email"> Official Email</Label>
            <Input id="email" type="email" value={profile?.email ?? ''} readOnly />
          </div>
        </div>
      </Section>

      <Section title="Notifications" description="Choose when the system alerts you.">
        <ToggleRow
          id="n-queue"
          label="New items in verification queue"
          hint="When a field is assigned to you"
          checked={preferences['n-queue'] ?? true}
          onCheckedChange={(checked) => setPreference('n-queue', checked)}
        />
        <ToggleRow
          id="n-pq"
          label="Parliamentary Question deadlines"
          hint="48 hours before the answer date"
          checked={preferences['n-pq'] ?? true}
          onCheckedChange={(checked) => setPreference('n-pq', checked)}
        />
        <ToggleRow
          id="n-ingest"
          label="Ingestion completed"
          hint="When a batch finishes OCR and extraction"
          checked={preferences['n-ingest'] ?? false}
          onCheckedChange={(checked) => setPreference('n-ingest', checked)}
        />
      </Section>

      <Section title="Data & security" description="Workspace records are saved separately for each account in this browser.">
        <ToggleRow
          id="audit"
          label="Full audit trail"
          hint="Log every approval, rejection and export"
          checked={preferences.audit ?? true}
          onCheckedChange={(checked) => setPreference('audit', checked)}
        />
        <ToggleRow
          id="onprem"
          label="On-premise inference"
          hint="Run models inside the departmental network"
          checked={preferences.onprem ?? false}
          onCheckedChange={(checked) => setPreference('onprem', checked)}
        />
      </Section>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            if (!name.trim()) {
              toast.error('Name cannot be empty.')
              return
            }
            updateProfile({ name: name.trim(), department: department.trim() })
            toast.success('Settings saved')
          }}
        >
          Save changes
        </Button>
      </div>
    </div>
  )
}
