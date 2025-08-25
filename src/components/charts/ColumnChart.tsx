import { BarChart } from '@tremor/react';

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
  const chartData = data.map(item => ({
    name: item.x,
    Digital: item.digital,
    Professional: item.professional,
    Direct: item.direct
  }));

  return (
    <div className="w-full h-80">
      {title && <h3 className="text-center text-lg font-semibold mb-4">{title}</h3>}
      <BarChart
        data={chartData}
        index="name"
        categories={["Digital", "Professional", "Direct"]}
        colors={["blue", "cyan", "indigo"]}
        yAxisWidth={48}
        showLegend={true}
        showGridLines={true}
        showAnimation={true}
        className="h-full"
      />
    </div>
  );
}
