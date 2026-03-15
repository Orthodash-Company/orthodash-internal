import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ClientProviders } from '@/components/layout/ClientProviders'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Orthodash - Analytics Platform',
  description: 'Comprehensive orthodontic practice analytics dashboard',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' },
    ],
  },
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}

export default Layout
