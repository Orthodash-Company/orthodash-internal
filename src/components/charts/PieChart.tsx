import { DonutChart } from '@tremor/react';

interface PieChartProps {
  data: Array<{
    x: string;
    y: number;
    text: string;
  }>;
  title?: string;
}

export function PieChart({ data, title }: PieChartProps) {
  const chartData = data.map(item => ({
    name: item.x,
    value: item.y
  }));

  return (
    <div className="w-full h-80">
      {title && <h3 className="text-center text-lg font-semibold mb-4">{title}</h3>}
      <DonutChart
        data={chartData}
        category="value"
        index="name"
        colors={["blue", "cyan", "indigo", "violet", "fuchsia"]}
        showAnimation={true}
        showLabel={true}
        className="h-full"
      />
    </div>
  );
}
