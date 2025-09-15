// Shared types for the ORTHODASH application
export interface PeriodConfig {
  id: string;
  name: string;
  title: string;
  locationId: string; // Keep for backward compatibility
  locationIds: string[]; // New field for multiple locations
  startDate: Date;
  endDate: Date;
  visualizations?: VisualizationOption[];
}

export interface Location {
  id: number;
  name: string;
  greyfinchId?: string;
  isActive?: boolean;
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
  production: { total: number; netProduction: number; data: any[] };
  summary: {
    totalLeads: number;
    totalAppointments: number;
    totalBookings: number;
    totalPatients: number;
    totalRevenue: number;
    totalProduction: number;
    totalNetProduction: number;
    gilbertCounts: {
      leads: number;
      appointments: number;
      bookings: number;
      patients: number;
      revenue: number;
      production: number;
      netProduction: number;
    };
    scottsdaleCounts: {
      leads: number;
      appointments: number;
      bookings: number;
      patients: number;
      revenue: number;
      production: number;
      netProduction: number;
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
  production: number;
  netProduction: number;
  acquisitionCosts: number;
}

// New interface for compact cost management
export interface CompactCost {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
}

export interface PeriodCosts {
  periodId: string;
  costs: CompactCost[];
  total: number;
}