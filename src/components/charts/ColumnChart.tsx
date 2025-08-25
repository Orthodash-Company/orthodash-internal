import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => [`${value}%`, '']} />
          <Legend />
          <Bar dataKey="Digital" fill="#1976D2" />
          <Bar dataKey="Professional" fill="#00BCD4" />
          <Bar dataKey="Direct" fill="#1d1d52" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
