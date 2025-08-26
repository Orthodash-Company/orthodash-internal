import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// import { QueryClientProvider } from '@tanstack/react-query'
// import { queryClient } from '@/lib/queryClient'
import { ClientProviders } from '@/components/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Orthodash - Analytics Platform',
  description: 'Comprehensive orthodontic practice analytics dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
