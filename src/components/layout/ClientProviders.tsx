'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/hooks/use-auth'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/toaster'

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        {children}
      </TooltipProvider>
    </AuthProvider>
  )
}
