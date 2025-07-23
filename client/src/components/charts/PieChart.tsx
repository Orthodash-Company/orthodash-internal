import { PieChart as RechartsPieChart, Cell, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PieChartProps {
  data: Array<{
    x: string;
    y: number;
    text: string;
  }>;
  title?: string;
}

const COLORS = ['#1976D2', '#00BCD4', '#1d1d52'];

export function PieChart({ data, title }: PieChartProps) {
  const chartData = data.map(item => ({
    name: item.x,
    value: item.y,
    label: item.text
  }));

  return (
    <div className="w-full h-80">
      {title && <h3 className="text-center text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ label }) => label}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
