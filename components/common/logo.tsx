import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#d5dde4] bg-white shadow-sm',
        className,
      )}
    >
      <img
        src="/geomine-astra-logo.png"
        alt=""
        className="size-full p-1 object-contain"
        aria-hidden="true"
      />
    </div>
  )
}
