"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Tremor-based chart components
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  }
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactNode
  }
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex aspect-video justify-center text-xs", className)}
      {...props}
    >
      {children}
    </div>
  )
})
ChartContainer.displayName = "Chart"

// Tremor components are self-contained, so we provide simple wrappers
const ChartTooltip = ({ children, ...props }: any) => <div {...props}>{children}</div>
const ChartTooltipContent = ({ children, ...props }: any) => <div {...props}>{children}</div>
const ChartLegend = ({ children, ...props }: any) => <div {...props}>{children}</div>
const ChartLegendContent = ({ children, ...props }: any) => <div {...props}>{children}</div>
const ChartStyle = () => null

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
