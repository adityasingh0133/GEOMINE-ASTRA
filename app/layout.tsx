import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google'
import { AppStateProvider } from '@/lib/app-state'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })
const sourceSerif = Source_Serif_4({ subsets: ['latin'], variable: '--font-source-serif' })

export const metadata: Metadata = {
  title: 'GeoMine Intelligence — AI Document Intelligence for CMPDI / CIL',
  description:
    'SIH26023 prototype: AI-powered geological, mining and reporting solution with confidence scoring, source provenance, cited answers and traceable report generation.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f5f4ef',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} ${sourceSerif.variable} bg-background`}>
      <body className="antialiased">
        <AppStateProvider>
          {children}
          <Toaster theme="light" position="bottom-right" richColors />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AppStateProvider>
      </body>
    </html>
  )
}
