import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value) => [`${value}%`, '']} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Digital" 
            stroke="#1976D2" 
            strokeWidth={3}
            dot={{ fill: '#1976D2', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="Professional" 
            stroke="#00BCD4" 
            strokeWidth={3}
            dot={{ fill: '#00BCD4', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="Direct" 
            stroke="#1d1d52" 
            strokeWidth={3}
            dot={{ fill: '#1d1d52', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
