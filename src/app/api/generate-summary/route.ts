import { NextRequest, NextResponse } from 'next/server'
import { generateAnalyticsSummary } from '@/lib/services/openai'

export async function POST(request: NextRequest) {
  try {
    const { periods, periodData } = await request.json()
    
    if (!periods || !periodData) {
      return NextResponse.json({ error: "Periods and period data are required" }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const summary = await generateAnalyticsSummary(periods, periodData)
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error generating AI summary:', error)
    return NextResponse.json({ 
      error: "Failed to generate AI summary",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
