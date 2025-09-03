import { greyfinchService } from './greyfinch'
import { GreyfinchSchemaUtils, GREYFINCH_QUERIES, GreyfinchErrorHandler } from './greyfinch-schema'

export interface GreyfinchDataResult {
  success: boolean
  data?: any
  message: string
  error?: string
}

export interface PeriodData {
  avgNetProduction: number
  avgAcquisitionCost: number
  noShowRate: number
  referralSources: {
    digital: number
    professional: number
    direct: number
  }
  conversionRates: {
    digital: number
    professional: number
    direct: number
  }
  trends: {
    weekly: Array<{ week: string; value: number }>
  }
  patients: number
  appointments: number
  leads: number
  locations: number
  bookings: number
}

export class GreyfinchDataService {
  
  /**
   * Fetch comprehensive data for dashboard analytics
   */
  static async fetchDashboardData(userId: string): Promise<GreyfinchDataResult> {
    try {
      console.log('Fetching comprehensive dashboard data from Greyfinch...')
      
      const result = {
        success: true,
        data: {
          counts: {
            patients: 0,
            locations: 0,
            appointments: 0,
            leads: 0,
            bookings: 0
          },
          locations: [],
          patients: [],
          appointments: [],
          leads: [],
          bookings: [],
          periodData: {}
        },
        message: 'Dashboard data fetched successfully'
      }

      // Fetch all data types with proper field naming
      const dataPromises = [
        this.fetchLocations(),
        this.fetchPatients(),
        this.fetchAppointments(),
        this.fetchLeads(),
        this.fetchBookings()
      ]

      const [locationsResult, patientsResult, appointmentsResult, leadsResult, bookingsResult] = 
        await Promise.allSettled(dataPromises)

      // Process locations
      if (locationsResult.status === 'fulfilled' && locationsResult.value.success) {
        result.data.locations = locationsResult.value.data || []
        result.data.counts.locations = result.data.locations.length
      }

      // Process patients
      if (patientsResult.status === 'fulfilled' && patientsResult.value.success) {
        result.data.patients = patientsResult.value.data || []
        result.data.counts.patients = result.data.patients.length
      }

      // Process appointments
      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value.success) {
        result.data.appointments = appointmentsResult.value.data || []
        result.data.counts.appointments = result.data.appointments.length
      }

      // Process leads
      if (leadsResult.status === 'fulfilled' && leadsResult.value.success) {
        result.data.leads = leadsResult.value.data || []
        result.data.counts.leads = result.data.leads.length
      }

      // Process bookings
      if (bookingsResult.status === 'fulfilled' && bookingsResult.value.success) {
        result.data.bookings = bookingsResult.value.data || []
        result.data.counts.bookings = result.data.bookings.length
      }

      console.log('Dashboard data fetched successfully:', result.data.counts)
      return result

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch dashboard data',
        error: 'FETCH_ERROR'
      }
    }
  }

  /**
   * Fetch locations with proper field naming
   */
  static async fetchLocations(): Promise<GreyfinchDataResult> {
    try {
      console.log('Fetching locations from Greyfinch...')
      
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_ANALYTICS_DATA)
      
      if (result?.locations) {
        return {
          success: true,
          data: result.locations,
          message: `Successfully fetched ${result.locations.length} locations`
        }
      } else {
        return {
          success: false,
          message: 'No locations data received',
          error: 'NO_DATA'
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      if (GreyfinchErrorHandler.isFieldError(error)) {
        const fieldName = GreyfinchErrorHandler.getFieldNameFromError(error)
        if (fieldName) {
          const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
          console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch locations',
        error: 'LOCATIONS_ERROR'
      }
    }
  }

  /**
   * Fetch patients with proper field naming
   */
  static async fetchPatients(): Promise<GreyfinchDataResult> {
    try {
      console.log('Fetching patients from Greyfinch...')
      
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_ANALYTICS_DATA)
      
      if (result?.patients) {
        return {
          success: true,
          data: result.patients,
          message: `Successfully fetched ${result.patients.length} patients`
        }
      } else {
        return {
          success: false,
          message: 'No patients data received',
          error: 'NO_DATA'
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      if (GreyfinchErrorHandler.isFieldError(error)) {
        const fieldName = GreyfinchErrorHandler.getFieldNameFromError(error)
        if (fieldName) {
          const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
          console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch patients',
        error: 'PATIENTS_ERROR'
      }
    }
  }

  /**
   * Fetch appointments with proper field naming
   */
  static async fetchAppointments(): Promise<GreyfinchDataResult> {
    try {
      console.log('Fetching appointments from Greyfinch...')
      
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_ANALYTICS_DATA)
      
      if (result?.appointments) {
        return {
          success: true,
          data: result.appointments,
          message: `Successfully fetched ${result.appointments.length} appointments`
        }
      } else {
        return {
          success: false,
          message: 'No appointments data received',
          error: 'NO_DATA'
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      if (GreyfinchErrorHandler.isFieldError(error)) {
        const fieldName = GreyfinchErrorHandler.getFieldNameFromError(error)
        if (fieldName) {
          const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
          console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch appointments',
        error: 'APPOINTMENTS_ERROR'
      }
    }
  }

  /**
   * Fetch leads with proper field naming
   */
  static async fetchLeads(): Promise<GreyfinchDataResult> {
    try {
      console.log('Fetching leads from Greyfinch...')
      
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_ANALYTICS_DATA)
      
      if (result?.leads) {
        return {
          success: true,
          data: result.leads,
          message: `Successfully fetched ${result.leads.length} leads`
        }
      } else {
        return {
          success: false,
          message: 'No leads data received',
          error: 'NO_DATA'
        }
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      if (GreyfinchErrorHandler.isFieldError(error)) {
        const fieldName = GreyfinchErrorHandler.getFieldNameFromError(error)
        if (fieldName) {
          const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
          console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch leads',
        error: 'LEADS_ERROR'
      }
    }
  }

  /**
   * Fetch bookings with proper field naming
   */
  static async fetchBookings(): Promise<GreyfinchDataResult> {
    try {
      console.log('Fetching bookings from Greyfinch...')
      
      const result = await greyfinchService.makeGraphQLRequest(GREYFINCH_QUERIES.GET_ANALYTICS_DATA)
      
      if (result?.appointmentBookings) {
        return {
          success: true,
          data: result.appointmentBookings,
          message: `Successfully fetched ${result.appointmentBookings.length} bookings`
        }
      } else {
        return {
          success: false,
          message: 'No bookings data received',
          error: 'NO_DATA'
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      if (GreyfinchErrorHandler.isFieldError(error)) {
        const fieldName = GreyfinchErrorHandler.getFieldNameFromError(error)
        if (fieldName) {
          const suggestion = GreyfinchErrorHandler.suggestCorrection(fieldName)
          console.log(`Field error: "${fieldName}" should be "${suggestion}"`)
        }
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch bookings',
        error: 'BOOKINGS_ERROR'
      }
    }
  }

  /**
   * Generate period-specific analytics data
   */
  static generatePeriodData(
    period: { startDate: string; endDate: string; locationId?: string },
    greyfinchData: any
  ): PeriodData {
    if (!greyfinchData || !greyfinchData.data) {
      return this.getDefaultPeriodData()
    }

    const { data } = greyfinchData
    const { startDate, endDate, locationId } = period

    // Filter data by date range and location
    const filteredAppointments = this.filterDataByPeriod(
      data.appointments || [],
      startDate,
      endDate,
      locationId
    )

    const filteredPatients = this.filterDataByPeriod(
      data.patients || [],
      startDate,
      endDate,
      locationId
    )

    const filteredLeads = this.filterDataByPeriod(
      data.leads || [],
      startDate,
      endDate,
      locationId
    )

    // Calculate metrics
    const totalAppointments = filteredAppointments.length
    const noShowAppointments = filteredAppointments.filter((apt: any) => 
      apt.status === 'no-show' || apt.status === 'cancelled'
    ).length
    const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0

    // Calculate referral sources (this would need actual referral data from Greyfinch)
    const referralSources = this.calculateReferralSources(filteredPatients, filteredLeads)

    // Calculate conversion rates
    const conversionRates = this.calculateConversionRates(filteredLeads, filteredPatients)

    // Generate weekly trends
    const trends = this.generateWeeklyTrends(filteredAppointments, startDate, endDate)

    return {
      avgNetProduction: this.calculateAverageNetProduction(filteredAppointments),
      avgAcquisitionCost: this.calculateAverageAcquisitionCost(filteredLeads),
      noShowRate,
      referralSources,
      conversionRates,
      trends,
      patients: filteredPatients.length,
      appointments: totalAppointments,
      leads: filteredLeads.length,
      locations: data.locations?.length || 0,
      bookings: data.bookings?.length || 0
    }
  }

  /**
   * Filter data by date range and location
   */
  private static filterDataByPeriod(data: any[], startDate: string, endDate: string, locationId?: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    return data.filter((item: any) => {
      // Check date range
      const itemDate = new Date(item.createdAt || item.scheduledDate || item.startTime)
      const inDateRange = itemDate >= start && itemDate <= end

      // Check location if specified
      if (locationId) {
        const itemLocationId = item.locationId || item.primaryLocation?.id
        return inDateRange && itemLocationId === locationId
      }

      return inDateRange
    })
  }

  /**
   * Calculate referral sources distribution
   */
  private static calculateReferralSources(patients: any[], leads: any[]): { digital: number; professional: number; direct: number } {
    // This is a simplified calculation - in reality, you'd need referral source data from Greyfinch
    const total = patients.length + leads.length
    
    if (total === 0) {
      return { digital: 0, professional: 0, direct: 0 }
    }

    // Simulate referral source distribution based on data patterns
    const digital = Math.floor((patients.length * 0.4) + (leads.length * 0.6))
    const professional = Math.floor((patients.length * 0.35) + (leads.length * 0.25))
    const direct = total - digital - professional

    return {
      digital: Math.max(0, digital),
      professional: Math.max(0, professional),
      direct: Math.max(0, direct)
    }
  }

  /**
   * Calculate conversion rates
   */
  private static calculateConversionRates(leads: any[], patients: any[]): { digital: number; professional: number; direct: number } {
    const totalLeads = leads.length
    const totalPatients = patients.length

    if (totalLeads === 0) {
      return { digital: 0, professional: 0, direct: 0 }
    }

    const overallConversionRate = (totalPatients / totalLeads) * 100

    // Simulate different conversion rates by source
    return {
      digital: overallConversionRate * 0.8, // Digital leads convert at 80% of overall rate
      professional: overallConversionRate * 1.2, // Professional referrals convert at 120% of overall rate
      direct: overallConversionRate * 1.0 // Direct converts at overall rate
    }
  }

  /**
   * Generate weekly trends data
   */
  private static generateWeeklyTrends(appointments: any[], startDate: string, endDate: string) {
    const weeks: Array<{ week: string; value: number }> = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    let currentWeek = new Date(start)
    while (currentWeek <= end) {
      const weekStart = new Date(currentWeek)
      const weekEnd = new Date(currentWeek)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const weekAppointments = appointments.filter((apt: any) => {
        const aptDate = new Date(apt.scheduledDate || apt.startTime)
        return aptDate >= weekStart && aptDate <= weekEnd
      })

      weeks.push({
        week: weekStart.toISOString().split('T')[0],
        value: weekAppointments.length
      })

      currentWeek.setDate(currentWeek.getDate() + 7)
    }

    return { weekly: weeks }
  }

  /**
   * Calculate average net production
   */
  private static calculateAverageNetProduction(appointments: any[]): number {
    if (appointments.length === 0) return 0

    // This would need actual revenue data from Greyfinch
    // For now, we'll simulate based on appointment count
    const totalRevenue = appointments.length * 250 // Simulated average appointment value
    return totalRevenue / appointments.length
  }

  /**
   * Calculate average acquisition cost
   */
  private static calculateAverageAcquisitionCost(leads: any[]): number {
    if (leads.length === 0) return 0

    // This would need actual cost data from Greyfinch or external sources
    // For now, we'll simulate based on lead count
    const totalCost = leads.length * 150 // Simulated average cost per lead
    return totalCost / leads.length
  }

  /**
   * Get default period data when no data is available
   */
  private static getDefaultPeriodData(): PeriodData {
    return {
      avgNetProduction: 0,
      avgAcquisitionCost: 0,
      noShowRate: 0,
      referralSources: { digital: 0, professional: 0, direct: 0 },
      conversionRates: { digital: 0, professional: 0, direct: 0 },
      trends: { weekly: [] },
      patients: 0,
      appointments: 0,
      leads: 0,
      locations: 0,
      bookings: 0
    }
  }
}

export default GreyfinchDataService
