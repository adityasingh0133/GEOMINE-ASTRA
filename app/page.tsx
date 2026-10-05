import { LoginForm } from '@/components/login/login-form'
import { LogoMark } from '@/components/common/logo'
import { FileSearch, ShieldCheck, MessageSquareText, FileText } from 'lucide-react'

const steps = [
  { icon: FileSearch, label: 'Find', desc: 'OCR & structure recovery across PDFs, scans and spreadsheets' },
  { icon: ShieldCheck, label: 'Verify', desc: 'Every value carries confidence, source and page reference' },
  { icon: MessageSquareText, label: 'Answer', desc: 'Source-cited answers from confidence-tagged documents' },
  { icon: FileText, label: 'Report', desc: 'Traceable drafts, approved by an authorised officer' },
]

export default function LoginPage() {
  return (
    <main className="grid-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_400px_at_50%_0%,oklch(0.72_0.07_145/8%),transparent)]"
        aria-hidden="true"
      />
      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <section className="hidden flex-col gap-8 lg:flex">
          <div className="flex items-center gap-3">
            <LogoMark className="size-11" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Government of India · Ministry of Coal
              </p>
              <p className="text-sm font-medium">CMPDI / CIL Subsidiaries</p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
              The documents behind every number — machine-readable, searchable and{' '}
              <span className="text-primary">verifiable.</span>
            </h2>
            <p className="max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              AI-assisted document intelligence with human verification. The system prepares traceable drafts;
              authorised officers remain responsible for final approval.
            </p>
          </div>
          <ol className="grid grid-cols-2 gap-3">
            {steps.map((s, i) => (
              <li key={s.label} className="glass rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <s.icon className="size-4 text-primary" aria-hidden="true" />
                  <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="glass mx-auto w-full max-w-md rounded-lg border border-border p-8 shadow-xl shadow-black/5">
          <div className="flex flex-col items-center gap-3 text-center">
            <LogoMark className="size-12" />
            <h1 className="text-2xl font-semibold tracking-tight">GEOMINE-ASTRA</h1>
            <p className="text-sm text-muted-foreground">Advanced System for Tracking &amp; Reporting Analytics for CMPDI / CIL</p>
            <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-primary">
              SIH 2026 • PROTOTYPE
            </span>
          </div>
          <LoginForm />
          <div className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-5">
            <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Intelligence Workspace
            </span>
          </div>
        </section>
      </div>
    </main>
  )
}
