import type { Metadata } from 'next'
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google'
import './globals.css'

const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex' })
const serif = Source_Serif_4({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-serif4' })

export const metadata: Metadata = {
  title: 'Every claim shows its evidence',
  description: 'A concept for claim-level citations in a research answer, by Krishna Bhupathi.',
  robots: { index: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plex.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
