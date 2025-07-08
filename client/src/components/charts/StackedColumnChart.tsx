import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  Legend,
  Category,
  Tooltip,
  StackingColumnSeries,
  DataLabel
} from '@syncfusion/ej2-react-charts';

interface StackedColumnChartProps {
  data: Array<{
    x: string;
    digital: number;
    professional: number;
    direct: number;
  }>;
  title?: string;
}

export function StackedColumnChart({ data, title }: StackedColumnChartProps) {
  const primaryxAxis = { valueType: 'Category' as const };
  const primaryyAxis = { labelFormat: '{value}%' };

  return (
    <ChartComponent
      id="stacked-column-chart"
      primaryXAxis={primaryxAxis}
      primaryYAxis={primaryyAxis}
      title={title}
      height="300px"
      background="transparent"
    >
      <Inject services={[StackingColumnSeries, Legend, Tooltip, Category, DataLabel]} />
      <SeriesCollectionDirective>
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="digital"
          type="StackingColumn"
          name="Digital"
          fill="#1976D2"
        />
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="professional"
          type="StackingColumn"
          name="Professional"
          fill="#00BCD4"
        />
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="direct"
          type="StackingColumn"
          name="Direct"
          fill="#FF5722"
        />
      </SeriesCollectionDirective>
    </ChartComponent>
  );
}
