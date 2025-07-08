import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  Legend,
  Category,
  Tooltip,
  SplineSeries,
  DataLabel
} from '@syncfusion/ej2-react-charts';

interface SplineChartProps {
  data: Array<{
    x: string;
    digital: number;
    professional: number;
    direct: number;
  }>;
  title?: string;
}

export function SplineChart({ data, title }: SplineChartProps) {
  const primaryxAxis = { valueType: 'Category' as const };
  const primaryyAxis = { labelFormat: '{value}%' };

  return (
    <ChartComponent
      id="spline-chart"
      primaryXAxis={primaryxAxis}
      primaryYAxis={primaryyAxis}
      title={title}
      height="300px"
      background="transparent"
    >
      <Inject services={[SplineSeries, Legend, Tooltip, Category, DataLabel]} />
      <SeriesCollectionDirective>
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="digital"
          type="Spline"
          name="Digital"
          width={3}
          marker={{ visible: true, width: 8, height: 8 }}
          fill="#1976D2"
        />
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="professional"
          type="Spline"
          name="Professional"
          width={3}
          marker={{ visible: true, width: 8, height: 8 }}
          fill="#00BCD4"
        />
        <SeriesDirective
          dataSource={data}
          xName="x"
          yName="direct"
          type="Spline"
          name="Direct"
          width={3}
          marker={{ visible: true, width: 8, height: 8 }}
          fill="#FF5722"
        />
      </SeriesCollectionDirective>
    </ChartComponent>
  );
}
