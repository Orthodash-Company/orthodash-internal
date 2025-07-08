import {
  AccumulationChartComponent,
  AccumulationSeriesCollectionDirective,
  AccumulationSeriesDirective,
  Inject,
  AccumulationLegend,
  AccumulationDataLabel,
  AccumulationTooltip,
  PieSeries
} from '@syncfusion/ej2-react-charts';

interface PieChartProps {
  data: Array<{
    x: string;
    y: number;
    text: string;
  }>;
  title?: string;
}

export function PieChart({ data, title }: PieChartProps) {
  return (
    <AccumulationChartComponent
      id="pie-chart"
      title={title}
      enableSmartLabels={true}
      height="300px"
      background="transparent"
    >
      <Inject services={[AccumulationLegend, AccumulationDataLabel, AccumulationTooltip, PieSeries]} />
      <AccumulationSeriesCollectionDirective>
        <AccumulationSeriesDirective
          dataSource={data}
          xName="x"
          yName="y"
          type="Pie"
          dataLabel={{ visible: true, name: 'text', position: 'Inside' }}
          radius="90%"
          explode={true}
          explodeIndex={0}
          explodeOffset="10%"
        />
      </AccumulationSeriesCollectionDirective>
    </AccumulationChartComponent>
  );
}
