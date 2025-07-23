interface GreyfinchConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

interface GreyfinchPatient {
  id: string;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  referralSource?: string;
  appointments?: GreyfinchAppointment[];
  treatments?: GreyfinchTreatment[];
}

interface GreyfinchAppointment {
  id: string;
  date: string;
  status: string;
  type: string;
  noShow: boolean;
}

interface GreyfinchTreatment {
  id: string;
  status: string;
  netProduction: number;
  startDate: string;
}

export interface ReferralSourceData {
  digital: number;
  professional: number;
  direct: number;
}

export interface ConversionRateData {
  digital: number;
  professional: number;
  direct: number;
}

export interface AnalyticsData {
  avgNetProduction: number;
  avgAcquisitionCost: number;
  noShowRate: number;
  referralSources: ReferralSourceData;
  conversionRates: ConversionRateData;
  trends: {
    weekly: Array<{
      week: string;
      digital: number;
      professional: number;
      direct: number;
    }>;
  };
}

export class GreyfinchService {
  private config: GreyfinchConfig;

  constructor() {
    this.config = {
      apiKey: (process.env.GREYFINCH_API_KEY || '').trim(),
      apiSecret: (process.env.GREYFINCH_API_SECRET || '').trim(),
      baseUrl: 'https://connect.greyfinch.com/graphql'
    };
  }

  private async makeGraphQLRequest(query: string, variables?: any): Promise<any> {
    try {
      // Validate API credentials first
      if (!this.config.apiKey || !this.config.apiSecret) {
        throw new Error('Greyfinch API credentials are missing');
      }

      // Clean and encode headers to handle special characters
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Validate and clean headers before adding them
      const cleanApiKey = this.config.apiKey.replace(/[^\x00-\x7F]/g, "").trim();
      const cleanSecret = this.config.apiSecret.replace(/[^\x00-\x7F]/g, "").trim();
      
      if (!cleanApiKey || !cleanSecret) {
        throw new Error('API credentials contain invalid characters for HTTP headers');
      }

      // Add authorization headers with cleaned values
      headers['Authorization'] = `Bearer ${cleanApiKey}`;
      headers['X-API-Secret'] = cleanSecret;

      const response = await fetch(this.config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Greyfinch API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors[0].message}`);
      }

      return data.data;
    } catch (error) {
      console.error('Greyfinch API request failed:', error);
      throw error;
    }
  }

  async getPatients(locationId?: string, startDate?: string, endDate?: string): Promise<GreyfinchPatient[]> {
    const query = `
      query GetPatients($locationId: String, $startDate: String, $endDate: String) {
        patients(
          where: {
            ${locationId ? 'locationId: { _eq: $locationId }' : ''}
            ${startDate && endDate ? 'createdAt: { _gte: $startDate, _lte: $endDate }' : ''}
          }
        ) {
          id
          person {
            id
            firstName
            lastName
            birthDate
          }
          referralSource
          appointments {
            id
            date
            status
            type
            noShow
          }
          treatments {
            id
            status
            netProduction
            startDate
          }
        }
      }
    `;

    const variables = { locationId, startDate, endDate };
    const data = await this.makeGraphQLRequest(query, variables);
    return data.patients || [];
  }

  private isValidCredentials(): boolean {
    // Check for basic credential presence and validate character encoding
    if (!this.config.apiKey || !this.config.apiSecret) {
      return false;
    }
    
    try {
      // Test if credentials contain only valid ASCII characters for HTTP headers
      const apiKeyValid = /^[\x00-\x7F]*$/.test(this.config.apiKey);
      const secretValid = /^[\x00-\x7F]*$/.test(this.config.apiSecret);
      return apiKeyValid && secretValid && this.config.apiKey.length > 0 && this.config.apiSecret.length > 0;
    } catch {
      return false;
    }
  }

  async getAnalytics(locationId?: string, startDate?: string, endDate?: string): Promise<AnalyticsData> {
    // Validate API credentials
    if (!this.isValidCredentials()) {
      throw new Error('Greyfinch API credentials are missing or invalid. Please provide valid GREYFINCH_API_KEY and GREYFINCH_API_SECRET.');
    }

    try {
      const patients = await this.getPatients(locationId, startDate, endDate);
      
      // Process patients data to calculate analytics
      const analytics: AnalyticsData = {
        avgNetProduction: 0,
        avgAcquisitionCost: 0,
        noShowRate: 0,
        referralSources: { digital: 0, professional: 0, direct: 0 },
        conversionRates: { digital: 0, professional: 0, direct: 0 },
        trends: { weekly: [] }
      };

    if (patients.length === 0) {
      return analytics;
    }

    // Calculate referral source distribution
    const referralCounts = { digital: 0, professional: 0, direct: 0 };
    const conversionCounts = { digital: 0, professional: 0, direct: 0 };
    const totalConversions = { digital: 0, professional: 0, direct: 0 };
    
    let totalNetProduction = 0;
    let totalNoShows = 0;
    let totalAppointments = 0;

    patients.forEach(patient => {
      const source = this.categorizeReferralSource(patient.referralSource);
      referralCounts[source]++;

      // Check if patient converted (has active treatment)
      const hasActiveTreatment = patient.treatments?.some(t => t.status === 'active');
      if (hasActiveTreatment) {
        conversionCounts[source]++;
        totalNetProduction += patient.treatments?.reduce((sum, t) => sum + (t.netProduction || 0), 0) || 0;
      }
      totalConversions[source]++;

      // Count no-shows
      patient.appointments?.forEach(apt => {
        totalAppointments++;
        if (apt.noShow) {
          totalNoShows++;
        }
      });
    });

    // Calculate percentages and averages
    const totalPatients = patients.length;
    analytics.referralSources = {
      digital: Math.round((referralCounts.digital / totalPatients) * 100),
      professional: Math.round((referralCounts.professional / totalPatients) * 100),
      direct: Math.round((referralCounts.direct / totalPatients) * 100)
    };

    analytics.conversionRates = {
      digital: totalConversions.digital > 0 ? Math.round((conversionCounts.digital / totalConversions.digital) * 100) : 0,
      professional: totalConversions.professional > 0 ? Math.round((conversionCounts.professional / totalConversions.professional) * 100) : 0,
      direct: totalConversions.direct > 0 ? Math.round((conversionCounts.direct / totalConversions.direct) * 100) : 0
    };

    analytics.avgNetProduction = conversionCounts.digital + conversionCounts.professional + conversionCounts.direct > 0 
      ? Math.round(totalNetProduction / (conversionCounts.digital + conversionCounts.professional + conversionCounts.direct))
      : 0;

    analytics.noShowRate = totalAppointments > 0 ? Math.round((totalNoShows / totalAppointments) * 100) : 0;

    // Generate weekly trends (simplified for demo)
    analytics.trends.weekly = this.generateWeeklyTrends(patients, startDate, endDate);

    return analytics;
    } catch (error) {
      console.error('Error fetching data from Greyfinch API:', error);
      throw new Error(`Failed to fetch analytics from Greyfinch API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private categorizeReferralSource(source?: string): keyof ReferralSourceData {
    if (!source) return 'direct';
    
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('digital') || lowerSource.includes('online') || lowerSource.includes('web') || lowerSource.includes('google')) {
      return 'digital';
    }
    if (lowerSource.includes('referral') || lowerSource.includes('professional') || lowerSource.includes('doctor')) {
      return 'professional';
    }
    return 'direct';
  }

  private generateWeeklyTrends(patients: GreyfinchPatient[], startDate?: string, endDate?: string): any[] {
    if (!patients.length) return [];

    // Group patients by week based on their creation/first appointment date
    const weeklyData: { [key: string]: { digital: number; professional: number; direct: number } } = {};
    
    patients.forEach(patient => {
      // Use first appointment date or a fallback date
      const patientDate = patient.appointments?.[0]?.date || patient.person?.birthDate || startDate || new Date().toISOString();
      const date = new Date(patientDate);
      const weekNumber = this.getWeekNumber(date);
      const weekKey = `Week ${weekNumber}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { digital: 0, professional: 0, direct: 0 };
      }
      
      const source = this.categorizeReferralSource(patient.referralSource);
      weeklyData[weekKey][source]++;
    });

    // Convert to array format and calculate percentages
    return Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, counts]) => {
        const total = counts.digital + counts.professional + counts.direct;
        return {
          week,
          digital: total > 0 ? Math.round((counts.digital / total) * 100) : 0,
          professional: total > 0 ? Math.round((counts.professional / total) * 100) : 0,
          direct: total > 0 ? Math.round((counts.direct / total) * 100) : 0
        };
      });
  }

  private getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
    return week;
  }

  async getLocations(): Promise<any[]> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error('Greyfinch API credentials are missing. Please provide valid GREYFINCH_API_KEY and GREYFINCH_API_SECRET.');
    }

    try {
      const query = `
        query GetLocations {
          locations {
            id
            name
            address
            patientCount
            lastSyncDate
          }
        }
      `;

      const response = await this.makeGraphQLRequest(query);
      return response.locations || [];
    } catch (error) {
      console.error('Error fetching Greyfinch locations:', error);
      throw new Error(`Failed to fetch locations from Greyfinch API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const greyfinchService = new GreyfinchService();
