import { greyfinchService } from './greyfinch'

export interface AnalysisResult {
  totalLeads: number
  leadSources: {
    digital: number
    professional: number
    direct: number
    other: number
  }
  totalPatients: number
  conversionRate: number
  locationPerformance: {
    [locationId: string]: {
      leads: number
      patients: number
      conversionRate: number
      revenue: number
    }
  }
  periodAnalysis: {
    [periodId: string]: {
      leads: number
      patients: number
      conversionRate: number
      revenue: number
      costs: number
      roi: number
    }
  }
  insights: string[]
  recommendations: string[]
}

export class AnalysisService {
  
  // Pull detailed data and run analysis when user adds analysis periods
  async runAnalysisForPeriods(userId: string, periodConfigs: any[], acquisitionCosts: any = {}) {
    try {
      console.log('Running analysis for periods:', periodConfigs.length)
      
      // Pull detailed data for the periods
      const detailedDataResult = await greyfinchService.pullDetailedData(userId, periodConfigs)
      
      if (!detailedDataResult.success) {
        throw new Error(detailedDataResult.message)
      }
      
      const detailedData = detailedDataResult.data
      
      // Run analysis
      const analysis = await this.analyzeData(detailedData, periodConfigs, acquisitionCosts)
      
      return {
        success: true,
        analysis,
        detailedData,
        message: 'Analysis completed successfully'
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  // Analyze the data and generate insights
  private async analyzeData(detailedData: any, periodConfigs: any[], acquisitionCosts: any): Promise<AnalysisResult> {
    const analysis: AnalysisResult = {
      totalLeads: 0,
      leadSources: { digital: 0, professional: 0, direct: 0, other: 0 },
      totalPatients: 0,
      conversionRate: 0,
      locationPerformance: {},
      periodAnalysis: {},
      insights: [],
      recommendations: []
    }
    
    // Calculate total leads and patients
    analysis.totalLeads = detailedData.patients?.length || 0
    analysis.totalPatients = detailedData.patients?.filter((p: any) => p.treatments?.length > 0).length || 0
    
    // Calculate conversion rate
    analysis.conversionRate = analysis.totalLeads > 0 
      ? (analysis.totalPatients / analysis.totalLeads) * 100 
      : 0
    
    // Analyze by location
    if (detailedData.locations) {
      detailedData.locations.forEach((location: any) => {
        const locationPatients = detailedData.patients?.filter((p: any) => 
          p.locationId === location.id || p.treatments?.some((t: any) => t.locationId === location.id)
        ) || []
        
        const locationLeads = locationPatients.length
        const locationConverted = locationPatients.filter((p: any) => p.treatments?.length > 0).length
        
        analysis.locationPerformance[location.id] = {
          leads: locationLeads,
          patients: locationConverted,
          conversionRate: locationLeads > 0 ? (locationConverted / locationLeads) * 100 : 0,
          revenue: locationConverted * 5200 // Average treatment value
        }
      })
    }
    
    // Analyze by period
    if (detailedData.periodData) {
      Object.keys(detailedData.periodData).forEach(periodId => {
        const periodData = detailedData.periodData[periodId]
        const periodConfig = periodConfigs.find(p => p.id === periodId)
        
        if (periodData && periodConfig) {
          const periodLeads = periodData.leads?.length || 0
          const periodPatients = periodData.patients?.length || 0
          const periodRevenue = periodPatients * 5200
          const periodCosts = this.getPeriodCosts(periodConfig, acquisitionCosts)
          
          analysis.periodAnalysis[periodId] = {
            leads: periodLeads,
            patients: periodPatients,
            conversionRate: periodLeads > 0 ? (periodPatients / periodLeads) * 100 : 0,
            revenue: periodRevenue,
            costs: periodCosts,
            roi: periodCosts > 0 ? ((periodRevenue - periodCosts) / periodCosts) * 100 : 0
          }
        }
      })
    }
    
    // Generate insights
    analysis.insights = this.generateInsights(analysis)
    analysis.recommendations = this.generateRecommendations(analysis)
    
    return analysis
  }
  
  // Get costs for a specific period
  private getPeriodCosts(periodConfig: any, acquisitionCosts: any): number {
    if (!acquisitionCosts || !periodConfig) return 0
    
    const periodStart = new Date(periodConfig.startDate)
    const periodEnd = new Date(periodConfig.endDate)
    
    let totalCosts = 0
    
    // Sum up costs for this period
    Object.values(acquisitionCosts).forEach((costGroup: any) => {
      if (Array.isArray(costGroup)) {
        costGroup.forEach((cost: any) => {
          if (cost.period) {
            const costDate = new Date(cost.period)
            if (costDate >= periodStart && costDate <= periodEnd) {
              totalCosts += cost.cost || 0
            }
          }
        })
      }
    })
    
    return totalCosts
  }
  
  // Generate insights based on analysis
  private generateInsights(analysis: AnalysisResult): string[] {
    const insights: string[] = []
    
    if (analysis.conversionRate < 50) {
      insights.push(`Low conversion rate of ${analysis.conversionRate.toFixed(1)}% - consider improving lead nurturing`)
    } else if (analysis.conversionRate > 80) {
      insights.push(`Excellent conversion rate of ${analysis.conversionRate.toFixed(1)}% - focus on lead generation`)
    }
    
    // Find best performing location
    const locations = Object.values(analysis.locationPerformance)
    if (locations.length > 0) {
      const bestLocation = locations.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      )
      insights.push(`Best performing location has ${bestLocation.conversionRate.toFixed(1)}% conversion rate`)
    }
    
    // Find best performing period
    const periods = Object.values(analysis.periodAnalysis)
    if (periods.length > 0) {
      const bestPeriod = periods.reduce((best, current) => 
        current.roi > best.roi ? current : best
      )
      insights.push(`Best ROI period: ${bestPeriod.roi.toFixed(1)}% return on investment`)
    }
    
    return insights
  }
  
  // Generate recommendations based on analysis
  private generateRecommendations(analysis: AnalysisResult): string[] {
    const recommendations: string[] = []
    
    if (analysis.conversionRate < 50) {
      recommendations.push('Implement lead scoring and automated follow-up sequences')
      recommendations.push('Review and optimize consultation booking process')
    }
    
    if (analysis.totalLeads < 100) {
      recommendations.push('Increase marketing spend on high-performing channels')
      recommendations.push('Develop referral program for existing patients')
    }
    
    // Location-specific recommendations
    Object.entries(analysis.locationPerformance).forEach(([locationId, performance]) => {
      if (performance.conversionRate < 40) {
        recommendations.push(`Review processes at location ${locationId} - low conversion rate`)
      }
    })
    
    return recommendations
  }
}

export const analysisService = new AnalysisService()
