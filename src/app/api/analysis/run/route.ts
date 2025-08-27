import { NextRequest, NextResponse } from 'next/server'
import { analysisService } from '@/lib/services/analysis-service'

export async function POST(request: NextRequest) {
  try {
    const { userId, periodConfigs, acquisitionCosts } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: 'User ID is required' 
      }, { status: 400 })
    }
    
    console.log('Running analysis for user:', userId, 'with', periodConfigs?.length || 0, 'periods')
    
    // Run analysis
    const result = await analysisService.runAnalysisForPeriods(userId, periodConfigs || [], acquisitionCosts || {})
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Analysis completed successfully',
        data: {
          analysis: result.analysis,
          detailedData: result.detailedData,
          analyzedAt: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || 'Analysis failed',
        error: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Analysis failed:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to run analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
