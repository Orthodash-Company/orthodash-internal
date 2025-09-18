import { PeriodData } from './greyfinch-data'

export interface LocationData {
  id: string
  name: string
  patients: number
  appointments: number
  leads: number
  bookings: number
  production: number
  revenue: number
  netProduction: number
  acquisitionCosts: number
}

export interface ProcessedMultiLocationData {
  total: PeriodData
  locations: {
    gilbert: LocationData
    phoenix: LocationData
  }
  trends: {
    weekly: Array<{ week: string; gilbert: number; phoenix: number; total: number }>
    monthly: Array<{ month: string; gilbert: number; phoenix: number; total: number }>
  }
  financialMetrics: {
    totalProduction: number
    totalRevenue: number
    totalNetProduction: number
    totalAcquisitionCosts: number
    profitMargin: number
    roi: number
  }
}

export class MultiLocationDataProcessor {
  
  /**
   * Process raw Greyfinch data into structured multi-location format
   */
  static processMultiLocationData(rawData: any, startDate?: string, endDate?: string): ProcessedMultiLocationData {
    console.log('Processing multi-location data...')
    
    const locations = this.extractLocations(rawData)
    const gilbertData = this.processLocationData(rawData, 'Gilbert', startDate, endDate)
    const phoenixData = this.processLocationData(rawData, 'Phoenix-Ahwatukee', startDate, endDate)
    
    // Calculate totals
    const totalData: PeriodData = {
      period: this.getPeriodFromDates(startDate, endDate),
      startDate: startDate || '',
      endDate: endDate || '',
      avgNetProduction: (gilbertData.netProduction + phoenixData.netProduction) / 2,
      avgAcquisitionCost: (gilbertData.acquisitionCosts + phoenixData.acquisitionCosts) / 2,
      noShowRate: this.calculateNoShowRate(rawData.appointments || []),
      referralSources: this.calculateReferralSources(rawData.leads || []),
      conversionRates: this.calculateConversionRates(rawData.leads || [], rawData.appointments || []),
      trends: {
        weekly: this.calculateWeeklyTrends(rawData.appointments || [], rawData.revenue || [])
      },
      patients: gilbertData.patients + phoenixData.patients,
      appointments: gilbertData.appointments + phoenixData.appointments,
      leads: gilbertData.leads + phoenixData.leads,
      locations: locations.length,
      bookings: gilbertData.bookings + phoenixData.bookings,
      production: gilbertData.production + phoenixData.production,
      revenue: gilbertData.revenue + phoenixData.revenue,
      netProduction: gilbertData.netProduction + phoenixData.netProduction,
      acquisitionCosts: gilbertData.acquisitionCosts + phoenixData.acquisitionCosts,
      locationData: {
        gilbert: gilbertData,
        phoenix: phoenixData
      }
    }
    
    // Calculate financial metrics
    const financialMetrics = this.calculateFinancialMetrics(totalData)
    
    // Calculate trends
    const trends = this.calculateMultiLocationTrends(rawData)
    
    return {
      total: totalData,
      locations: {
        gilbert: gilbertData,
        phoenix: phoenixData
      },
      trends,
      financialMetrics
    }
  }
  
  /**
   * Extract locations from raw data
   */
  private static extractLocations(rawData: any): any[] {
    // Handle both array format and object format
    if (Array.isArray(rawData.locations)) {
      return rawData.locations
    } else if (rawData.locations && typeof rawData.locations === 'object') {
      return Object.values(rawData.locations)
    }
    return []
  }
  
  /**
   * Process data for a specific location
   */
  private static processLocationData(rawData: any, locationName: string, startDate?: string, endDate?: string): LocationData {
    const locations = this.extractLocations(rawData)
    const location = locations.find((loc: any) => loc.name === locationName)
    if (!location) {
      console.warn(`Location ${locationName} not found in data`)
      return this.getEmptyLocationData(locationName)
    }
    
    // Handle fallback data structure from analytics endpoint
    if (rawData.gilbertCounts && locationName === 'Gilbert') {
      return {
        id: location.id,
        name: locationName,
        patients: rawData.gilbertCounts.patients || 0,
        appointments: rawData.gilbertCounts.appointments || 0,
        leads: rawData.gilbertCounts.leads || 0,
        bookings: rawData.gilbertCounts.bookings || 0,
        production: rawData.gilbertCounts.production || 0,
        revenue: rawData.gilbertCounts.revenue || 0,
        netProduction: rawData.gilbertCounts.netProduction || 0,
        acquisitionCosts: (rawData.gilbertCounts.leads || 0) * 150 // Estimated cost per lead
      }
    }
    
    if (rawData.phoenixCounts && locationName === 'Phoenix-Ahwatukee') {
      return {
        id: location.id,
        name: locationName,
        patients: rawData.phoenixCounts.patients || 0,
        appointments: rawData.phoenixCounts.appointments || 0,
        leads: rawData.phoenixCounts.leads || 0,
        bookings: rawData.phoenixCounts.bookings || 0,
        production: rawData.phoenixCounts.production || 0,
        revenue: rawData.phoenixCounts.revenue || 0,
        netProduction: rawData.phoenixCounts.netProduction || 0,
        acquisitionCosts: (rawData.phoenixCounts.leads || 0) * 150 // Estimated cost per lead
      }
    }
    
    // Fallback to original processing if data structure is different
    const filteredData = this.filterDataByLocationAndDate(rawData, locationName, startDate, endDate)
    
    // Calculate metrics - handle both array and object formats
    const patients = Array.isArray(filteredData.patients) ? filteredData.patients.length : (filteredData.patients?.count || 0)
    const appointments = Array.isArray(filteredData.appointments) ? filteredData.appointments.length : (filteredData.appointments?.count || 0)
    const leads = Array.isArray(filteredData.leads) ? filteredData.leads.length : (filteredData.leads?.count || 0)
    const bookings = Array.isArray(filteredData.bookings) ? filteredData.bookings.length : (filteredData.bookings?.count || 0)
    
    // Calculate financial metrics with accurate revenue/production calculations
    const appointmentsArray = Array.isArray(filteredData.appointments) ? filteredData.appointments : (filteredData.appointments?.data || [])
    const production = this.calculateProduction(appointmentsArray, filteredData.production)
    const revenue = this.calculateRevenue(appointmentsArray, filteredData.revenue)
    const netProduction = this.calculateNetProduction(production, appointmentsArray)
    const acquisitionCosts = this.calculateAcquisitionCosts(leads, appointmentsArray)
    
    return {
      id: location.id,
      name: locationName,
      patients,
      appointments,
      leads,
      bookings,
      production,
      revenue,
      netProduction,
      acquisitionCosts
    }
  }
  
  /**
   * Filter data by location and date range
   */
  private static filterDataByLocationAndDate(rawData: any, locationName: string, startDate?: string, endDate?: string): any {
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    
    const filterByDate = (items: any[], dateField: string) => {
      if (!Array.isArray(items)) return []
      if (!start && !end) return items
      return items.filter((item: any) => {
        const itemDate = new Date(item[dateField])
        if (start && itemDate < start) return false
        if (end && itemDate > end) return false
        return true
      })
    }
    
    const filterByLocation = (items: any[], locationField: string) => {
      if (!Array.isArray(items)) return []
      return items.filter((item: any) => {
        const location = item[locationField]
        return location?.name === locationName || 
               location?.id === locationName ||
               (typeof locationName === 'string' && location?.name?.toLowerCase().includes(locationName.toLowerCase()))
      })
    }
    
    return {
      patients: filterByDate(filterByLocation(rawData.patients || [], 'primaryLocation'), 'createdAt'),
      appointments: filterByDate(filterByLocation(rawData.appointments || [], 'location'), 'scheduledDate'),
      leads: filterByDate(filterByLocation(rawData.leads || [], 'location'), 'createdAt'),
      bookings: filterByDate(filterByLocation(rawData.appointmentBookings || [], 'appointment'), 'startTime'),
      revenue: filterByDate(filterByLocation(rawData.revenue || [], 'location'), 'date'),
      production: filterByDate(filterByLocation(rawData.production || [], 'location'), 'date')
    }
  }
  
  /**
   * Calculate production with accurate financial data
   */
  private static calculateProduction(appointments: any[], productionData: any[]): number {
    let totalProduction = 0
    
    // Sum from appointments
    appointments.forEach((apt: any) => {
      totalProduction += parseFloat(apt.production || apt.productionAmount || apt.value || apt.amount || 0)
    })
    
    // Sum from dedicated production data
    productionData.forEach((prod: any) => {
      totalProduction += parseFloat(prod.productionAmount || 0)
    })
    
    return totalProduction
  }
  
  /**
   * Calculate revenue with accurate financial data
   */
  private static calculateRevenue(appointments: any[], revenueData: any[]): number {
    let totalRevenue = 0
    
    // Sum from appointments
    appointments.forEach((apt: any) => {
      totalRevenue += parseFloat(apt.revenue || apt.fee || apt.amount || 0)
    })
    
    // Sum from dedicated revenue data
    revenueData.forEach((rev: any) => {
      totalRevenue += parseFloat(rev.amount || 0)
    })
    
    return totalRevenue
  }
  
  /**
   * Calculate net production (revenue - costs)
   */
  private static calculateNetProduction(production: number, appointments: any[]): number {
    let totalCosts = 0
    
    // Calculate costs from appointments
    appointments.forEach((apt: any) => {
      totalCosts += parseFloat(apt.cost || 0)
    })
    
    return production - totalCosts
  }
  
  /**
   * Calculate acquisition costs
   */
  private static calculateAcquisitionCosts(leads: any[], appointments: any[]): number {
    // This would typically come from marketing spend data
    // For now, using a simple calculation based on lead volume
    const leadCount = leads.length
    const avgCostPerLead = 150 // This should come from actual marketing data
    return leadCount * avgCostPerLead
  }
  
  /**
   * Calculate no-show rate
   */
  private static calculateNoShowRate(appointments: any): number {
    if (!appointments) return 0
    
    // Handle both array and object formats
    const appointmentsArray = Array.isArray(appointments) ? appointments : (appointments.data || [])
    const totalAppointments = appointmentsArray.length
    if (totalAppointments === 0) return 0
    
    const noShowAppointments = appointmentsArray.filter((apt: any) => 
      apt.status === 'no-show' || apt.status === 'cancelled'
    ).length
    
    return (noShowAppointments / totalAppointments) * 100
  }
  
  /**
   * Calculate referral sources
   */
  private static calculateReferralSources(leads: any): any {
    const sources = { digital: 0, professional: 0, direct: 0 }
    
    if (!leads) return sources
    
    const leadsArray = Array.isArray(leads) ? leads : (leads.data || [])
    
    leadsArray.forEach((lead: any) => {
      const source = lead.source?.toLowerCase() || ''
      if (source.includes('digital') || source.includes('online') || source.includes('social')) {
        sources.digital++
      } else if (source.includes('referral') || source.includes('doctor') || source.includes('professional')) {
        sources.professional++
      } else {
        sources.direct++
      }
    })
    
    return sources
  }
  
  /**
   * Calculate conversion rates
   */
  private static calculateConversionRates(leads: any, appointments: any): any {
    const totalLeads = Array.isArray(leads) ? leads.length : (leads?.count || 0)
    const totalAppointments = Array.isArray(appointments) ? appointments.length : (appointments?.count || 0)
    
    return {
      digital: totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0,
      professional: totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0,
      direct: totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0
    }
  }
  
  /**
   * Calculate weekly trends
   */
  private static calculateWeeklyTrends(appointments: any, revenue: any): Array<{ week: string; value: number }> {
    const weeklyData: Record<string, number> = {}
    
    // Process appointments
    const appointmentsArray = Array.isArray(appointments) ? appointments : (appointments?.data || [])
    appointmentsArray.forEach((apt: any) => {
      const date = new Date(apt.scheduledDate || apt.createdAt)
      const week = this.getWeekKey(date)
      weeklyData[week] = (weeklyData[week] || 0) + 1
    })
    
    // Process revenue
    const revenueArray = Array.isArray(revenue) ? revenue : (revenue?.data || [])
    revenueArray.forEach((rev: any) => {
      const date = new Date(rev.date)
      const week = this.getWeekKey(date)
      weeklyData[week] = (weeklyData[week] || 0) + parseFloat(rev.amount || 0)
    })
    
    return Object.entries(weeklyData)
      .map(([week, value]) => ({ week, value }))
      .sort((a, b) => a.week.localeCompare(b.week))
  }
  
  /**
   * Calculate multi-location trends
   */
  private static calculateMultiLocationTrends(rawData: any): any {
    const weeklyTrends: Record<string, { gilbert: number; phoenix: number; total: number }> = {}
    const monthlyTrends: Record<string, { gilbert: number; phoenix: number; total: number }> = {}
    
    // Process appointments for trends - handle both array and object formats
    const appointmentsArray = Array.isArray(rawData.appointments) ? rawData.appointments : (rawData.appointments?.data || [])
    appointmentsArray.forEach((apt: any) => {
      const date = new Date(apt.scheduledDate || apt.createdAt)
      const week = this.getWeekKey(date)
      const month = this.getMonthKey(date)
      const location = apt.location?.name
      
      if (!weeklyTrends[week]) {
        weeklyTrends[week] = { gilbert: 0, phoenix: 0, total: 0 }
      }
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { gilbert: 0, phoenix: 0, total: 0 }
      }
      
      weeklyTrends[week].total++
      monthlyTrends[month].total++
      
      if (location === 'Gilbert') {
        weeklyTrends[week].gilbert++
        monthlyTrends[month].gilbert++
      } else if (location === 'Phoenix-Ahwatukee') {
        weeklyTrends[week].phoenix++
        monthlyTrends[month].phoenix++
      }
    })
    
    return {
      weekly: Object.entries(weeklyTrends)
        .map(([week, data]) => ({ week, ...data }))
        .sort((a, b) => a.week.localeCompare(b.week)),
      monthly: Object.entries(monthlyTrends)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
    }
  }
  
  /**
   * Calculate financial metrics
   */
  private static calculateFinancialMetrics(totalData: PeriodData): any {
    const profitMargin = totalData.revenue > 0 ? (totalData.netProduction / totalData.revenue) * 100 : 0
    const roi = totalData.acquisitionCosts > 0 ? (totalData.netProduction / totalData.acquisitionCosts) * 100 : 0
    
    return {
      totalProduction: totalData.production,
      totalRevenue: totalData.revenue,
      totalNetProduction: totalData.netProduction,
      totalAcquisitionCosts: totalData.acquisitionCosts,
      profitMargin,
      roi
    }
  }
  
  /**
   * Get period string from dates
   */
  private static getPeriodFromDates(startDate?: string, endDate?: string): string {
    if (!startDate || !endDate) return 'Current Period'
    return `${startDate} to ${endDate}`
  }
  
  /**
   * Get week key for grouping
   */
  private static getWeekKey(date: Date): string {
    const year = date.getFullYear()
    const week = this.getWeekNumber(date)
    return `${year}-W${week.toString().padStart(2, '0')}`
  }
  
  /**
   * Get month key for grouping
   */
  private static getMonthKey(date: Date): string {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    return `${year}-${month.toString().padStart(2, '0')}`
  }
  
  /**
   * Get week number
   */
  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }
  
  /**
   * Get empty location data
   */
  private static getEmptyLocationData(name: string): LocationData {
    return {
      id: '',
      name,
      patients: 0,
      appointments: 0,
      leads: 0,
      bookings: 0,
      production: 0,
      revenue: 0,
      netProduction: 0,
      acquisitionCosts: 0
    }
  }
}
