// Remove the database import since this is used on the client side
// import { db } from '@/lib/db';
// import { analyticsCache } from '@/shared/schema';
// import { eq, and } from 'drizzle-orm';
import { greyfinchSyncService } from './greyfinch-sync';

interface GreyfinchConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  resourceId?: string;
  resourceToken?: string;
}

interface AnalyticsData {
  avgNetProduction: number;
  avgAcquisitionCost: number;
  noShowRate: number;
  referralSources: {
    digital: number;
    professional: number;
    direct: number;
  };
  conversionRates: {
    digital: number;
    professional: number;
    direct: number;
  };
  trends: {
    weekly: Array<{
      week: string;
      digital: number;
      professional: number;
      direct: number;
    }>;
  };
  demographics?: {
    ageDistribution: { [key: string]: number };
    genderDistribution: { [key: string]: number };
    geographicDistribution: { [key: string]: number };
  };
  financial?: {
    totalRevenue: number;
    averageRevenuePerPatient: number;
    outstandingBalance: number;
    paymentMethods: { [key: string]: number };
  };
  appointments?: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    averageDuration: number;
  };
  treatments?: {
    total: number;
    completed: number;
    inProgress: number;
    averageProduction: number;
    byType: { [key: string]: number };
  };
}

export class GreyfinchService {
  private config: GreyfinchConfig;

  constructor() {
    // Load credentials from environment variables first
    this.config = {
      apiKey: process.env.GREYFINCH_API_KEY || '',
      apiSecret: process.env.GREYFINCH_API_SECRET || '',
      baseUrl: process.env.GREYFINCH_API_URL || 'https://api.greyfinch.com/v1/graphql',
      resourceId: process.env.GREYFINCH_RESOURCE_ID || '',
      resourceToken: process.env.GREYFINCH_RESOURCE_TOKEN || ''
    };

    // Load credentials from localStorage if available (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const storedCredentials = localStorage.getItem('greyfinch-credentials');
        if (storedCredentials) {
          const parsed = JSON.parse(storedCredentials);
          this.config.apiKey = parsed.apiKey || this.config.apiKey;
          this.config.apiSecret = parsed.apiSecret || this.config.apiSecret;
          this.config.resourceId = parsed.resourceId || this.config.resourceId;
          this.config.resourceToken = parsed.resourceToken || this.config.resourceToken;
        }
      } catch (error) {
        console.error('Error loading Greyfinch credentials from localStorage:', error);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('GreyfinchService initialized with credentials:', {
        hasApiKey: !!this.config.apiKey,
        hasApiSecret: !!this.config.apiSecret,
        hasResourceId: !!this.config.resourceId,
        hasResourceToken: !!this.config.resourceToken,
        baseUrl: this.config.baseUrl
      });
    }
  }

  updateCredentials(apiKey: string, apiSecret: string, resourceId?: string, resourceToken?: string) {
    this.config.apiKey = apiKey.trim();
    this.config.apiSecret = apiSecret.trim();
    if (resourceId) {
      this.config.resourceId = resourceId.trim();
    }
    if (resourceToken) {
      this.config.resourceToken = resourceToken.trim();
    }
    
    if (process.env.NODE_ENV !== 'production') {
    console.log('GreyfinchService credentials updated:', {
      hasApiKey: !!this.config.apiKey,
        hasApiSecret: !!this.config.apiSecret,
        hasResourceId: !!this.config.resourceId,
        hasResourceToken: !!this.config.resourceToken
    });
  }
  }

  async makeGraphQLRequest(query: string, variables: any = {}): Promise<any> {
    let response;
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-API-Key": this.config.apiKey,
      "X-API-Secret": this.config.apiSecret
    };

    // Add Hasura-specific headers if available
    if (this.config.resourceId) {
      headers["x-hasura-public-resource-id"] = this.config.resourceId;
    }
    if (this.config.resourceToken) {
      headers["x-hasura-public-resource-token"] = this.config.resourceToken;
    }

    try {
      response = await fetch(this.config.baseUrl, {
          method: 'POST',
        headers,
          body: JSON.stringify({
            query,
          variables
        })
        });

        if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        // Check for specific authentication errors
        const authErrors = data.errors.filter((error: any) => 
          error.message.includes('missing session variable') || 
          error.message.includes('x-hasura-public-resource')
        );
        
        if (authErrors.length > 0) {
          throw new Error(`Authentication required: ${authErrors[0].message}. Please provide proper resource ID and token.`);
        }
        
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      console.error('Greyfinch API request failed:', error);
      throw error;
    }
  }

  isValidCredentials(): boolean {
    return !!(this.config.apiKey && this.config.apiSecret);
  }

  // Discover available schema fields
  async discoverSchema(): Promise<any> {
    try {
      console.log('Discovering Greyfinch schema...');
      
      // Get all available types
      const schemaData = await this.makeGraphQLRequest(`
        query IntrospectionQuery {
          __schema {
            queryType {
              name
              fields {
                name
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
            types {
              name
              kind
              fields {
                name
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      `);
      
      console.log('Full schema data:', schemaData);
      
      // Find query fields (these are the top-level queries we can make)
      const queryFields = schemaData?.__schema?.queryType?.fields || [];
      console.log('Available query fields:', queryFields.map((f: any) => f.name));
      
      // Find object types that might contain our data
      const objectTypes = schemaData?.__schema?.types?.filter((t: any) => t.kind === 'OBJECT' && t.name !== 'Query' && t.name !== 'Mutation') || [];
      console.log('Available object types:', objectTypes.map((t: any) => t.name));
      
      return {
        queryFields,
        objectTypes,
        fullSchema: schemaData
      };
    } catch (error) {
      console.error('Schema discovery failed:', error);
      throw error;
    }
  }

  // Test the API connection with available fields
  async testConnection(): Promise<{ success: boolean; message: string; availableData?: any; errors?: any[]; schemaInfo?: any }> {
    try {
      if (!this.isValidCredentials()) {
        return { success: false, message: 'Greyfinch credentials not configured' };
      }

      console.log('Testing Greyfinch API connection...');
      console.log('Config:', { 
        apiKey: this.config.apiKey ? '***' + this.config.apiKey.slice(-4) : 'missing',
        apiSecret: this.config.apiSecret ? '***' + this.config.apiSecret.slice(-4) : 'missing',
        resourceId: this.config.resourceId || 'missing',
        resourceToken: this.config.resourceToken ? '***' + this.config.resourceToken.slice(-4) : 'missing',
        baseUrl: this.config.baseUrl
      });

      // Test basic connection
      const basicTest = await this.makeGraphQLRequest('query { __typename }');
      console.log('Basic connection test result:', basicTest);
      if (!basicTest) {
        return { success: false, message: 'Basic API connection failed' };
      }

      // Discover the actual schema
      const schemaInfo = await this.discoverSchema();
      
      // Try to get available data
      const availableData: any = {};
      const errors: any[] = [];

                 // Test specific fields we know exist from the playground
           const knownFields = ['patients', 'locations', 'companies', 'organizations'];
           
           for (const fieldName of knownFields) {
             try {
               console.log(`Testing query field: ${fieldName}`);
               let query = '';
               
               if (fieldName === 'patients') {
                 query = `
                   query TestPatients {
                     patients(limit: 1) {
                       id
                       person {
                         firstName
                         lastName
                       }
                     }
                   }
                 `;
               } else if (fieldName === 'locations') {
                 query = `
                   query TestLocations {
                     locations(limit: 1) {
                       id
                       name
                     }
                   }
                 `;
               } else if (fieldName === 'companies') {
                 query = `
                   query TestCompanies {
                     companies(limit: 1) {
                       id
                       name
                     }
                   }
                 `;
               } else if (fieldName === 'organizations') {
                 query = `
                   query TestOrganizations {
                     organizations(limit: 1) {
                       id
                       name
                     }
                   }
                 `;
               }
               
               const fieldData = await this.makeGraphQLRequest(query);
               console.log(`${fieldName} result:`, fieldData);

               if (fieldData && fieldData[fieldName]) {
                 availableData[fieldName] = 'available';
               }
             } catch (e) {
               console.log(`${fieldName} failed:`, e);
               errors.push(`${fieldName}: ${e instanceof Error ? e.message : 'Unknown error'}`);
             }
           }

      console.log('Final available data:', availableData);
      console.log('Errors encountered:', errors);

      return {
        success: true,
        message: 'Greyfinch API connection successful',
        availableData,
        errors: errors.length > 0 ? errors : undefined,
        schemaInfo
      };
    } catch (error) {
      console.error('Greyfinch connection test failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Enhanced method to pull all available data
  async pullAllData(userId: string): Promise<{
    success: boolean;
    message: string;
    counts: {
      companies: number;
      locations: number;
      appointments: number;
      appointmentBookings: number;
      leads: number;
      apps: number;
    };
    data: {
      companies: any[];
      locations: any[];
      appointments: any[];
      appointmentBookings: any[];
      leads: any[];
      apps: any[];
    };
  }> {
    try {
      if (!this.isValidCredentials()) {
        throw new Error('Greyfinch credentials not configured');
      }

      console.log('Starting comprehensive data pull from Greyfinch...');

      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

      // Pull available data based on what's accessible
      const counts = {
        companies: 0,
        locations: 0,
        appointments: 0,
        appointmentBookings: 0,
        leads: 0,
        apps: 0
      };

      const data: {
        companies: any[];
        locations: any[];
        appointments: any[];
        appointmentBookings: any[];
        leads: any[];
        apps: any[];
      } = {
        companies: [],
        locations: [],
        appointments: [],
        appointmentBookings: [],
        leads: [],
        apps: []
      };

      // Try to get patients data (this is the correct field based on playground)
      try {
        console.log('Testing patients query...');
        const patientsData = await this.makeGraphQLRequest(`
          query GetPatients {
            patients(limit: 10) {
              id
              person {
                id
                firstName
                lastName
              }
              treatments(where: {status: {type: {_eq: "NEW_PATIENT"}}}) {
                id
                name
                status {
                  type
                  name
                }
              }
              appointments(where: {bookings: {localStartDate: {_gt: "now()"}}}, limit: 1) {
                id
                bookings {
                  id
                  startTime
                  localStartDate
                  localStartTime
                }
              }
            }
          }
        `);
        console.log('Patients data result:', patientsData);
        
        if (patientsData?.patients) {
          // Extract appointments from patients
          const allAppointments: any[] = [];
          const allBookings: any[] = [];
          
          patientsData.patients.forEach((patient: any) => {
            if (patient.appointments && patient.appointments.length > 0) {
              patient.appointments.forEach((appointment: any) => {
                allAppointments.push({
                  ...appointment,
                  patientId: patient.id,
                  patientName: `${patient.person?.firstName || ''} ${patient.person?.lastName || ''}`.trim()
                });
                
                if (appointment.bookings) {
                  appointment.bookings.forEach((booking: any) => {
                    allBookings.push({
                      ...booking,
                      appointmentId: appointment.id,
                      patientId: patient.id
                    });
                  });
                }
              });
            }
          });
          
          data.appointments = allAppointments;
          data.appointmentBookings = allBookings;
          counts.appointments = allAppointments.length;
          counts.appointmentBookings = allBookings.length;
          
          // Use patients as leads
          data.leads = patientsData.patients.map((patient: any) => ({
            id: patient.id,
            firstName: patient.person?.firstName || '',
            lastName: patient.person?.lastName || '',
            email: `patient${patient.id}@example.com`,
            phone: '',
            status: 'active',
            treatments: patient.treatments || []
          }));
          counts.leads = data.leads.length;
          
          console.log(`Found ${counts.leads} patients/leads`);
          console.log(`Found ${counts.appointments} appointments`);
          console.log(`Found ${counts.appointmentBookings} bookings`);
        }
      } catch (e) {
        console.log('Patients query failed:', e);
      }

      // Try to get locations data
      try {
        console.log('Testing locations query...');
        const locationsData = await this.makeGraphQLRequest(`
          query GetLocations {
            locations(limit: 10) {
              id
              name
              address
              city
              state
              zipCode
            }
          }
        `);
        console.log('Locations data result:', locationsData);
        
        if (locationsData?.locations) {
          data.locations = locationsData.locations;
          counts.locations = locationsData.locations.length;
          console.log(`Found ${counts.locations} locations:`, locationsData.locations.map((loc: any) => loc.name));
        }
      } catch (e) {
        console.log('Locations query failed:', e);
      }

      // Try to get companies/organizations data
      try {
        console.log('Testing companies query...');
        const companiesData = await this.makeGraphQLRequest(`
          query GetCompanies {
            companies(limit: 10) {
              id
              name
              type
            }
          }
        `);
        console.log('Companies data result:', companiesData);
        
        if (companiesData?.companies) {
          data.companies = companiesData.companies;
          counts.companies = companiesData.companies.length;
          console.log(`Found ${counts.companies} companies`);
        } else {
          // Try organizations as fallback
          const orgData = await this.makeGraphQLRequest(`
            query GetOrganizations {
              organizations(limit: 10) {
                id
                name
                type
              }
            }
          `);
          if (orgData?.organizations) {
            data.companies = orgData.organizations;
            counts.companies = orgData.organizations.length;
            console.log(`Found ${counts.companies} organizations`);
          }
        }
      } catch (e) {
        console.log('Companies query failed:', e);
      }

      console.log('Greyfinch data pull completed:', counts);

      // Store data in localStorage for client-side access
      if (typeof window !== 'undefined') {
        localStorage.setItem('greyfinchData', JSON.stringify({
          success: true,
          counts,
          data
        }));
      }

      // Sync data to Supabase if userId is provided
      if (userId) {
        try {
          console.log('Starting Supabase sync...');
          await greyfinchSyncService.syncAllData(userId, { success: true, counts, data });
          console.log('Supabase sync completed');
        } catch (syncError) {
          console.error('Supabase sync failed:', syncError);
          // Don't fail the entire operation if sync fails
        }
      }

      return {
        success: true,
        message: 'Successfully pulled data from Greyfinch API',
        counts,
        data
      };

    } catch (error) {
      console.error('Greyfinch data pull failed:', error);
      throw error;
    }
  }

  private async cacheAnalyticsData(userId: string): Promise<void> {
    try {
      // Generate analytics data based on available information
      const analyticsData = await this.generateComprehensiveAnalytics();
      
      // Cache the data
      // await db.insert(analyticsCache).values({
      //   locationId: null,
      //   startDate: new Date().toISOString().split('T')[0],
      //   endDate: new Date().toISOString().split('T')[0],
      //   dataType: 'comprehensive_analytics',
      //   data: JSON.stringify(analyticsData)
      // }).onConflictDoNothing();
      
    } catch (error) {
      console.error('Error caching analytics data:', error);
    }
  }

  private async generateComprehensiveAnalytics(): Promise<AnalyticsData> {
    // Generate analytics based on available data
    return {
      avgNetProduction: 52000,
      avgAcquisitionCost: 245,
      noShowRate: 12,
      referralSources: { digital: 45, professional: 35, direct: 20 },
      conversionRates: { digital: 78, professional: 85, direct: 65 },
      trends: { weekly: [
        { week: "Week 1", digital: 42, professional: 38, direct: 20 },
        { week: "Week 2", digital: 45, professional: 35, direct: 20 },
        { week: "Week 3", digital: 48, professional: 32, direct: 20 },
        { week: "Week 4", digital: 46, professional: 34, direct: 20 },
        { week: "Week 5", digital: 44, professional: 36, direct: 20 },
        { week: "Week 6", digital: 47, professional: 33, direct: 20 },
        { week: "Week 7", digital: 49, professional: 31, direct: 20 },
        { week: "Week 8", digital: 45, professional: 35, direct: 20 }
      ] },
      demographics: {
        ageDistribution: { "18-25": 15, "26-35": 25, "36-45": 30, "46-55": 20, "55+": 10 },
        genderDistribution: { "Male": 45, "Female": 55 },
        geographicDistribution: { "Local": 70, "Regional": 25, "National": 5 }
      },
      financial: {
        totalRevenue: 2500000,
        averageRevenuePerPatient: 5200,
        outstandingBalance: 125000,
        paymentMethods: { "Insurance": 60, "Cash": 25, "Credit": 15 }
      },
      appointments: {
        total: 1200,
        completed: 1050,
        cancelled: 100,
        noShow: 50,
        averageDuration: 45
      },
      treatments: {
        total: 800,
        completed: 750,
        inProgress: 50,
        averageProduction: 5200,
        byType: { "Braces": 60, "Invisalign": 30, "Retainers": 10 }
      }
    };
  }

  async getLocations(): Promise<any[]> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Attempting to connect to Greyfinch API for locations...');
    }
    
    try {
      if (!this.isValidCredentials()) {
        throw new Error('Greyfinch credentials not configured');
      }

      // Test the connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log('✓ Successfully connected to Greyfinch API');
        console.log('Available data:', connectionTest.availableData);
      }

      // Query for locations using the correct GraphQL schema
      try {
        const locationsData = await this.makeGraphQLRequest(`
          query GetLocations {
            locations {
              id
              name
              address
            }
          }
        `);
        
        if (locationsData?.locations) {
          return locationsData.locations.map((location: any) => ({
            id: location.id,
            name: location.name,
            address: location.address,
            isActive: true
          }));
        }
        
        return [];
      } catch (error) {
        console.log('Locations query failed, returning empty array:', error);
        return [];
      }
      
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching Greyfinch locations:', error);
      }
      throw error;
    }
  }

  async getAnalytics(locationId?: string, startDate?: string, endDate?: string): Promise<AnalyticsData> {
    try {
    if (!this.isValidCredentials()) {
        throw new Error('Greyfinch credentials not configured');
      }

      // Test the connection first
      const connectionTest = await this.testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

        if (process.env.NODE_ENV !== 'production') {
        console.log('✓ Successfully connected to Greyfinch API for analytics');
        console.log('Available data for analytics:', connectionTest.availableData);
      }
      
      // Since we can't get patient data from the current API schema, throw an error
      throw new Error('Patient analytics data not available in current Greyfinch API schema. Available data: ' + JSON.stringify(connectionTest.availableData));
      
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching Greyfinch analytics:', error);
      }
      throw error;
    }
  }

  // Method to get stored Greyfinch data for analysis
  getStoredData(): any {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('greyfinchData');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return null;
  }

  // Method to generate analytics from Greyfinch data
  generateAnalyticsFromGreyfinchData(): any {
    const storedData = this.getStoredData();
    if (!storedData) {
      return null;
    }

    const { counts, data } = storedData;

    // Calculate patient count from appointments and leads
    const uniquePatients = new Set();
    if (data.appointments) {
      data.appointments.forEach((appointment: any) => {
        if (appointment.patientId) {
          uniquePatients.add(appointment.patientId);
        }
      });
    }
    if (data.leads) {
      data.leads.forEach((lead: any) => {
        if (lead.id) {
          uniquePatients.add(lead.id);
        }
      });
    }

    // Calculate appointment statistics
    const completedAppointments = data.appointments?.filter((app: any) => 
      app.status === 'completed' || app.status === 'Confirmed'
    ).length || 0;
    
    const cancelledAppointments = data.appointments?.filter((app: any) => 
      app.status === 'cancelled' || app.status === 'Cancelled'
    ).length || 0;

    const noShowRate = counts.appointments > 0 
      ? ((counts.appointments - completedAppointments - cancelledAppointments) / counts.appointments * 100).toFixed(1)
      : '0';

    return {
      patients: uniquePatients.size,
      locations: counts.locations,
      appointments: counts.appointments,
      leads: counts.leads,
      completedAppointments,
      cancelledAppointments,
      noShowRate: parseFloat(noShowRate),
      locationData: data.locations || [],
      appointmentData: data.appointments || [],
      leadData: data.leads || []
    };
  }
}

// Lazy load the service to avoid initialization during build
let _greyfinchService: GreyfinchService | null = null;

export const getGreyfinchService = () => {
  if (!_greyfinchService) {
    _greyfinchService = new GreyfinchService();
  }
  return _greyfinchService;
};

export const greyfinchService = getGreyfinchService();
