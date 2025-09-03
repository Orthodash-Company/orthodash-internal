// Shared types for the ORTHODASH application
export interface PeriodConfig {
  id: string;
  name: string;
  title: string;
  locationId: string;
  startDate: Date;
  endDate: Date;
  visualizations?: VisualizationOption[];
}

export interface Location {
  id: number;
  name: string;
  greyfinchId?: string;
}

export interface VisualizationOption {
  id: string;
  type: 'doughnut' | 'column' | 'spline' | 'stacked' | 'stacked-column';
  title: string;
  description: string;
  summary: string;
  explanation: string;
  icon: React.ComponentType<any>;
  options: string[];
}

export interface AnalyticsData {
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
}

export interface DataCounts {
  patients?: number;
  locations?: number;
  appointments?: number;
  leads?: number;
  bookings?: number;
  treatments?: number;
  revenue?: number;
  netProduction?: number;
  [key: string]: number | undefined;
}

export interface GreyfinchData {
  locations: Record<string, any>;
  leads: { count: number; data: any[] };
  appointments: { count: number; data: any[] };
  bookings: { count: number; data: any[] };
  patients: { count: number; data: any[] };
  revenue: { total: number; data: any[] };
  summary: {
    totalLeads: number;
    totalAppointments: number;
    totalBookings: number;
    totalPatients: number;
    totalRevenue: number;
    gilbertCounts: {
      leads: number;
      appointments: number;
      bookings: number;
      patients: number;
      revenue: number;
    };
    scottsdaleCounts: {
      leads: number;
      appointments: number;
      bookings: number;
      patients: number;
      revenue: number;
    };
  };
  lastUpdated: string;
  apiStatus?: string;
  queryParams?: any;
  periodData?: Record<string, any>;
}

export interface PeriodData {
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
  trends: { weekly: any[] };
  patients: number;
  appointments: number;
  leads: number;
  locations: number;
  bookings: number;
  revenue: number;
  netProduction: number;
}