import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  Legend,
  Category,
  Tooltip,
  ColumnSeries,
  DataLabel
} from '@syncfusion/ej2-react-charts';

interface ColumnChartProps {
  data: Array<{
    x: string;
    digital: number;
    professional: number;
    direct: number;
  }>;
  title?: string;
}

export function ColumnChart({ data, title }: ColumnChartProps) {
  const primaryxAxis = { valueType: 'Category' as const };
  const primaryyAxis = { labelFormat: '{value}%' };

  return (
    <ChartComponent
      id="column-chart"
      primaryXAxis={primaryxAxis}
      primaryYAxis={primaryyAxis}
      title={title}
      height="300px"
      background="transparent"
    >
      <Inject services={[ColumnSeries, Legend, Tooltip, Category, DataLabel]} />
      <SeriesCollectionDirective>
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="digital"
          type="Column"
          name="Digital"
          fill="#1976D2"
        />
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="professional"
          type="Column"
          name="Professional"
          fill="#00BCD4"
        />
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="direct"
          type="Column"
          name="Direct"
          fill="#FF5722"
        />
      </SeriesCollectionDirective>
    </ChartComponent>
  );
}
