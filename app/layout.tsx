import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { LenisProvider } from '@/components/providers/LenisProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://contextgraph.vercel.app'),
  title: {
    default: 'ContextGraph — Your context. Every AI.',
    template: '%s | ContextGraph',
  },
  description: 'A cross-AI personal context engine. Build your context graph once. Claude, ChatGPT, Codex — every AI reads from the same source of truth.',
  keywords: ['AI context', 'MCP', 'Model Context Protocol', 'Claude', 'ChatGPT', 'Codex', 'persistent memory', 'developer tools', 'context graph'],
  authors: [{ name: 'Prajyot Porje', url: 'https://github.com/prajyot-porje' }],
  creator: 'Prajyot Porje',
  openGraph: {
    type: 'website',
    siteName: 'ContextGraph',
    title: 'ContextGraph — Your context. Every AI.',
    description: 'Build your context graph once. Every AI you use reads from the same source of truth.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'ContextGraph — Cross-AI personal context engine',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ContextGraph — Your context. Every AI.',
    description: 'Cross-AI persistent context engine with MCP support. Free to start.',
    images: ['/og-image.png'],
    creator: '@prajyotporje',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                } else {
                  document.documentElement.removeAttribute('data-theme');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  )
}
