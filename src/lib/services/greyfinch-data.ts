import { greyfinchService } from './greyfinch'
import { GreyfinchSchemaUtils, GREYFINCH_QUERIES, GreyfinchErrorHandler } from './greyfinch-schema'

export interface GreyfinchDataResult {
  success: boolean
  data?: any
  message: string
  error?: string
}

export interface PeriodData {
  period: string
  startDate: string
  endDate: string
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
  // Financial metrics
  production: number
  revenue: number
  netProduction: number
  acquisitionCosts: number
  // Location-specific data
  locationData: {
    gilbert: {
      patients: number
      appointments: number
      leads: number
      bookings: number
      production: number
      revenue: number
      netProduction: number
      acquisitionCosts: number
    }
    phoenix: {
      patients: number
      appointments: number
      leads: number
      bookings: number
      production: number
      revenue: number
      netProduction: number
      acquisitionCosts: number
    }
  }
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
    period: { startDate: string; endDate: string; locationId?: string; locationIds?: string[] },
    greyfinchData: any
  ): PeriodData {
    if (!greyfinchData || !greyfinchData.data) {
      return this.getDefaultPeriodData()
    }

    const { data } = greyfinchData
    const { startDate, endDate, locationId, locationIds } = period

    // Handle multiple location selection
    const selectedLocationIds = locationIds && locationIds.length > 0 
      ? locationIds 
      : (locationId ? [locationId] : [])

    // Filter data by date range and location(s)
    const filteredAppointments = this.filterDataByPeriodAndLocations(
      data.appointments || [],
      startDate,
      endDate,
      selectedLocationIds
    )

    const filteredPatients = this.filterDataByPeriodAndLocations(
      data.patients || [],
      startDate,
      endDate,
      selectedLocationIds
    )

    const filteredLeads = this.filterDataByPeriodAndLocations(
      data.leads || [],
      startDate,
      endDate,
      selectedLocationIds
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

    // Calculate financial metrics
    const production = this.calculateTotalProduction(filteredAppointments)
    const revenue = this.calculateTotalRevenue(filteredAppointments)
    const avgAcquisitionCost = this.calculateAverageAcquisitionCost(filteredLeads)
    const acquisitionCosts = avgAcquisitionCost * filteredLeads.length // Total acquisition costs
    const netProduction = revenue - acquisitionCosts

    return {
      avgNetProduction: this.calculateAverageNetProduction(filteredAppointments),
      avgAcquisitionCost,
      noShowRate,
      referralSources,
      conversionRates,
      trends,
      patients: filteredPatients.length,
      appointments: totalAppointments,
      leads: filteredLeads.length,
      locations: data.locations?.length || 0,
      bookings: data.bookings?.length || 0,
      // Financial metrics
      production,
      revenue,
      netProduction,
      acquisitionCosts
    }
  }

  /**
   * Filter data by date range and location(s)
   */
  private static filterDataByPeriodAndLocations(data: any[], startDate: string, endDate: string, locationIds: string[]) {
    const start = new Date(startDate)
    const end = new Date(endDate)

    return data.filter((item: any) => {
      // Check date range
      const itemDate = new Date(item.createdAt || item.scheduledDate || item.startTime)
      const inDateRange = itemDate >= start && itemDate <= end

      // Check location(s) if specified
      if (locationIds && locationIds.length > 0) {
        const itemLocationId = item.locationId || item.primaryLocation?.id || item.location?.id
        const itemLocationName = item.location?.name || item.primaryLocation?.name
        
        // Check if item belongs to any of the selected locations
        const matchesLocation = locationIds.some(locId => {
          // Match by ID or name
          return itemLocationId === locId || 
                 itemLocationName === locId ||
                 (typeof locId === 'string' && itemLocationName?.toLowerCase().includes(locId.toLowerCase()))
        })
        
        return inDateRange && matchesLocation
      }

      return inDateRange
    })
  }

  /**
   * Filter data by date range and location (backward compatibility)
   */
  private static filterDataByPeriod(data: any[], startDate: string, endDate: string, locationId?: string) {
    const locationIds = locationId ? [locationId] : []
    return this.filterDataByPeriodAndLocations(data, startDate, endDate, locationIds)
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

    // Calculate actual revenue from appointments
    const totalRevenue = appointments.reduce((sum, appointment) => {
      // Use actual appointment value if available, otherwise use realistic estimate
      const appointmentValue = appointment.value || appointment.amount || appointment.fee || 250
      return sum + (parseFloat(appointmentValue) || 250)
    }, 0)
    
    return totalRevenue / appointments.length
  }

  /**
   * Calculate total production for a period
   */
  private static calculateTotalProduction(appointments: any[]): number {
    if (appointments.length === 0) return 0

    return appointments.reduce((sum, appointment) => {
      const appointmentValue = appointment.value || appointment.amount || appointment.fee || 250
      return sum + (parseFloat(appointmentValue) || 250)
    }, 0)
  }

  /**
   * Calculate total revenue for a period
   */
  private static calculateTotalRevenue(appointments: any[]): number {
    if (appointments.length === 0) return 0

    // Filter for completed appointments only
    const completedAppointments = appointments.filter(apt => 
      apt.status === 'completed' || apt.status === 'finished' || apt.status === 'done'
    )

    return completedAppointments.reduce((sum, appointment) => {
      const appointmentValue = appointment.value || appointment.amount || appointment.fee || 250
      return sum + (parseFloat(appointmentValue) || 250)
    }, 0)
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
   * Aggregate data by location for Live Data Integrations counters
   */
  static aggregateDataByLocation(greyfinchData: any): any {
    if (!greyfinchData || !greyfinchData.data) {
      return {
        totalCounts: {
          patients: 0,
          locations: 0,
          appointments: 0,
          leads: 0,
          bookings: 0
        },
        locationBreakdown: []
      }
    }

    const { data } = greyfinchData
    const locations = data.locations || []
    const patients = data.patients || []
    const appointments = data.appointments || []
    const leads = data.leads || []
    const bookings = data.appointmentBookings || []

    // Calculate total counts across all locations
    const totalCounts = {
      patients: patients.length,
      locations: locations.length,
      appointments: appointments.length,
      leads: leads.length,
      bookings: bookings.length
    }

    // Create breakdown by location
    const locationBreakdown = locations.map((location: any) => {
      const locationId = location.id
      const locationName = location.name

      // Count patients for this location
      const locationPatients = patients.filter((patient: any) => 
        patient.primaryLocation?.id === locationId || 
        patient.primaryLocation?.name === locationName
      )

      // Count appointments for this location
      const locationAppointments = appointments.filter((appointment: any) => 
        appointment.location?.id === locationId || 
        appointment.location?.name === locationName
      )

      // Count leads for this location
      const locationLeads = leads.filter((lead: any) => 
        lead.location?.id === locationId || 
        lead.location?.name === locationName
      )

      // Count bookings for this location
      const locationBookings = bookings.filter((booking: any) => 
        booking.appointment?.location?.id === locationId || 
        booking.appointment?.location?.name === locationName
      )

      // Calculate financial metrics for this location
      const locationRevenue = locationAppointments.reduce((sum: number, appointment: any) => {
        const value = appointment.revenue || appointment.value || appointment.amount || appointment.fee || 0
        return sum + (parseFloat(value) || 0)
      }, 0)

      const locationProduction = locationAppointments.reduce((sum: number, appointment: any) => {
        const value = appointment.revenue || appointment.value || appointment.amount || appointment.fee || 0
        return sum + (parseFloat(value) || 0)
      }, 0)

      return {
        id: locationId,
        name: locationName,
        address: location.address,
        isActive: location.isActive,
        counts: {
          patients: locationPatients.length,
          appointments: locationAppointments.length,
          leads: locationLeads.length,
          bookings: locationBookings.length
        },
        financial: {
          revenue: locationRevenue,
          production: locationProduction
        }
      }
    })

    return {
      totalCounts,
      locationBreakdown
    }
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
      bookings: 0,
      // Financial metrics
      production: 0,
      revenue: 0,
      netProduction: 0,
      acquisitionCosts: 0
    }
  }
}

export default GreyfinchDataService
