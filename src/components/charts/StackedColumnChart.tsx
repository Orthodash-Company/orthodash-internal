import { BarChart } from '@tremor/react';

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
        stack={true}
        className="h-full"
      />
    </div>
  );
}
