'use client'

import { CheckCircle } from 'lucide-react'

export function LocationsManager() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#1C1F4F]">Greyfinch Connection</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            API connection to Greyfinch practice management
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium ml-4">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-600">Connected</span>
        </div>
      </div>
    </div>
  )
}
