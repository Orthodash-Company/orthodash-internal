import { greyfinchService } from './greyfinch'
import { greyfinchSyncService } from './greyfinch-sync'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export interface AnalysisData {
  greyfinchData: any
  acquisitionCosts: any
  periods: any[]
  aiSummary: string
  reportData: any
}

export class GreyfinchDataFlowService {
  
  // Step 1: Pull data from Greyfinch and store in Supabase
  async pullAndStoreGreyfinchData(userId: string) {
    try {
      console.log('Step 1: Pulling data from Greyfinch...')
      const greyfinchData = await greyfinchService.pullAllData(userId)
      
      if (!greyfinchData.success) {
        throw new Error(`Failed to pull Greyfinch data: ${greyfinchData.message}`)
      }
      
      console.log('Step 2: Syncing data to Supabase...')
      await greyfinchSyncService.syncAllData(userId, greyfinchData)
      
      return {
        success: true,
        data: greyfinchData,
        message: 'Greyfinch data pulled and stored successfully'
      }
    } catch (error) {
      console.error('Error in pullAndStoreGreyfinchData:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Step 2: Generate AI analysis using OpenAI
  async generateAIAnalysis(userId: string, analysisData: AnalysisData) {
    try {
      console.log('Step 3: Generating AI analysis...')
      
      // Prepare data for OpenAI
      const prompt = this.buildAnalysisPrompt(analysisData)
      
      const response = await fetch('/api/openai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          prompt,
          data: analysisData
        }),
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI analysis failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      return {
        success: true,
        aiSummary: result.summary,
        recommendations: result.recommendations,
        insights: result.insights
      }
    } catch (error) {
      console.error('Error in generateAIAnalysis:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Step 3: Save analysis to session history
  async saveAnalysisToSession(userId: string, analysisData: AnalysisData) {
    try {
      console.log('Step 4: Saving analysis to session history...')
      
      const sessionData = {
        userId,
        name: `Analysis Session ${new Date().toLocaleDateString()}`,
        description: 'Comprehensive analysis session with Greyfinch data and AI insights',
        greyfinchData: analysisData.greyfinchData,
        acquisitionCosts: analysisData.acquisitionCosts,
        periods: analysisData.periods,
        aiSummary: analysisData.aiSummary,
        reportData: analysisData.reportData,
        createdAt: new Date().toISOString()
      }
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save session: ${response.status}`)
      }
      
      const result = await response.json()
      
      return {
        success: true,
        sessionId: result.id,
        message: 'Analysis saved to session history'
      }
    } catch (error) {
      console.error('Error in saveAnalysisToSession:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Step 4: Generate and save report
  async generateAndSaveReport(userId: string, analysisData: AnalysisData) {
    try {
      console.log('Step 5: Generating and saving report...')
      
      const reportData = {
        userId,
        title: `Orthodash Analysis Report - ${new Date().toLocaleDateString()}`,
        content: {
          summary: analysisData.aiSummary,
          greyfinchData: analysisData.greyfinchData,
          acquisitionCosts: analysisData.acquisitionCosts,
          periods: analysisData.periods,
          insights: analysisData.reportData?.insights || [],
          recommendations: analysisData.reportData?.recommendations || []
        },
        generatedAt: new Date().toISOString()
      }
      
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save report: ${response.status}`)
      }
      
      const result = await response.json()
      
      return {
        success: true,
        reportId: result.id,
        message: 'Report generated and saved successfully'
      }
    } catch (error) {
      console.error('Error in generateAndSaveReport:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Step 5: Complete data flow pipeline
  async runCompleteDataFlow(userId: string, acquisitionCosts: any, periods: any[]) {
    try {
      console.log('Starting complete data flow pipeline...')
      
      // Step 1: Pull and store Greyfinch data
      const greyfinchResult = await this.pullAndStoreGreyfinchData(userId)
      if (!greyfinchResult.success) {
        return greyfinchResult
      }
      
      // Step 2: Prepare analysis data
      const analysisData: AnalysisData = {
        greyfinchData: greyfinchResult.data,
        acquisitionCosts,
        periods,
        aiSummary: '',
        reportData: {}
      }
      
      // Step 3: Generate AI analysis
      const aiResult = await this.generateAIAnalysis(userId, analysisData)
      if (!aiResult.success) {
        return aiResult
      }
      
      // Update analysis data with AI results
      analysisData.aiSummary = aiResult.aiSummary
      analysisData.reportData = {
        insights: aiResult.insights,
        recommendations: aiResult.recommendations
      }
      
      // Step 4: Save to session history
      const sessionResult = await this.saveAnalysisToSession(userId, analysisData)
      if (!sessionResult.success) {
        return sessionResult
      }
      
      // Step 5: Generate and save report
      const reportResult = await this.generateAndSaveReport(userId, analysisData)
      if (!reportResult.success) {
        return reportResult
      }
      
      return {
        success: true,
        message: 'Complete data flow executed successfully',
        data: {
          greyfinchData: greyfinchResult.data,
          sessionId: sessionResult.sessionId,
          reportId: reportResult.reportId,
          aiSummary: aiResult.aiSummary
        }
      }
    } catch (error) {
      console.error('Error in runCompleteDataFlow:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Helper method to build analysis prompt
  private buildAnalysisPrompt(analysisData: AnalysisData): string {
    const { greyfinchData, acquisitionCosts, periods } = analysisData
    
    let prompt = `Analyze the following orthodontic practice data and provide insights and recommendations:

## Practice Data Summary:
- Locations: ${greyfinchData?.counts?.locations || 0}
- Patients: ${greyfinchData?.counts?.leads || 0}
- Appointments: ${greyfinchData?.counts?.appointments || 0}
- Total Acquisition Costs: $${acquisitionCosts?.totals?.total || 0}

## Analysis Periods: ${periods?.length || 0} periods analyzed

Please provide:
1. Key performance insights
2. Cost analysis and ROI recommendations
3. Patient acquisition strategy suggestions
4. Operational efficiency recommendations
5. Growth opportunities

Format the response as a comprehensive analysis report.`

    return prompt
  }
}

export const greyfinchDataFlowService = new GreyfinchDataFlowService()
