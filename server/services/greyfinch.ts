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
      apiKey: process.env.GREYFINCH_API_KEY || '',
      apiSecret: process.env.GREYFINCH_API_SECRET || '',
      baseUrl: 'https://connect.greyfinch.com/graphql'
    };
  }

  private async makeGraphQLRequest(query: string, variables?: any): Promise<any> {
    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-API-Secret': this.config.apiSecret
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      throw new Error(`Greyfinch API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL error: ${data.errors[0].message}`);
    }

    return data.data;
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

  async getAnalytics(locationId?: string, startDate?: string, endDate?: string): Promise<AnalyticsData> {
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
    // This is a simplified implementation
    // In a real implementation, you'd group patients by week and calculate trends
    return [
      { week: 'Week 1', digital: 45, professional: 30, direct: 25 },
      { week: 'Week 2', digital: 48, professional: 28, direct: 24 },
      { week: 'Week 3', digital: 50, professional: 29, direct: 21 },
      { week: 'Week 4', digital: 52, professional: 28, direct: 20 }
    ];
  }
}

export const greyfinchService = new GreyfinchService();
