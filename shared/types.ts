// Shared types for the ORTHODASH application
export interface PeriodConfig {
  id: string;
  name: string;
  title: string;
  locationId: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
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