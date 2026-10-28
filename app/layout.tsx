import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { ShortlistProvider } from '@/components/shortlist/shortlist-provider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Shortlist — A digest of accounts, every week',
  description:
    'A digest of accounts delivered every week — who to contact, why they fit, and what to say. Built for creative studios.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f2ee' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1822' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} bg-bg-weak-50`}
    >
      <body className="font-sans antialiased [font-family:var(--font-inter),Inter,ui-sans-serif,system-ui,sans-serif]">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ShortlistProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </ShortlistProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
