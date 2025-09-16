import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface LocationData {
  id: string;
  name: string;
  counts: {
    patients: number;
    appointments: number;
    leads: number;
    bookings: number;
  };
  financial: {
    revenue: number;
    production: number;
  };
}

interface MultiLocationComparisonChartProps {
  locationData: LocationData[];
  selectedLocationIds: string[];
  periodTitle: string;
}

const COLORS = ['#1C1F4F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function MultiLocationComparisonChart({ 
  locationData, 
  selectedLocationIds, 
  periodTitle 
}: MultiLocationComparisonChartProps) {
  // Filter data for selected locations only
  const selectedLocationData = locationData.filter(location => 
    selectedLocationIds.includes(location.id) || selectedLocationIds.includes(location.name)
  );

  if (selectedLocationData.length === 0) {
    return (
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Multi-Location Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select multiple locations to see comparison charts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const barChartData = selectedLocationData.map((location, index) => ({
    name: location.name,
    patients: location.counts.patients,
    appointments: location.counts.appointments,
    leads: location.counts.leads,
    bookings: location.counts.bookings,
    revenue: location.financial.revenue,
    production: location.financial.production,
    color: COLORS[index % COLORS.length]
  }));

  const pieChartData = selectedLocationData.map((location, index) => ({
    name: location.name,
    value: location.financial.revenue,
    color: COLORS[index % COLORS.length]
  }));

  const totalRevenue = selectedLocationData.reduce((sum, location) => sum + location.financial.revenue, 0);
  const totalProduction = selectedLocationData.reduce((sum, location) => sum + location.financial.production, 0);
  const totalPatients = selectedLocationData.reduce((sum, location) => sum + location.counts.patients, 0);
  const totalAppointments = selectedLocationData.reduce((sum, location) => sum + location.counts.appointments, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700">Total Patients</p>
                <p className="text-2xl font-bold text-blue-900">{totalPatients.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Total Appointments</p>
                <p className="text-2xl font-bold text-green-900">{totalAppointments.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-700">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-700">Total Production</p>
                <p className="text-2xl font-bold text-orange-900">${totalProduction.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Activity Comparison */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              Activity Comparison by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="patients" fill="#3B82F6" name="Patients" />
                <Bar dataKey="appointments" fill="#10B981" name="Appointments" />
                <Bar dataKey="leads" fill="#F59E0B" name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Revenue Distribution */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Revenue Distribution by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location Details Table */}
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Location Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Location</th>
                  <th className="text-right py-2 font-medium">Patients</th>
                  <th className="text-right py-2 font-medium">Appointments</th>
                  <th className="text-right py-2 font-medium">Leads</th>
                  <th className="text-right py-2 font-medium">Revenue</th>
                  <th className="text-right py-2 font-medium">Production</th>
                </tr>
              </thead>
              <tbody>
                {selectedLocationData.map((location, index) => (
                  <tr key={location.id} className="border-b">
                    <td className="py-2 font-medium">{location.name}</td>
                    <td className="py-2 text-right">{location.counts.patients.toLocaleString()}</td>
                    <td className="py-2 text-right">{location.counts.appointments.toLocaleString()}</td>
                    <td className="py-2 text-right">{location.counts.leads.toLocaleString()}</td>
                    <td className="py-2 text-right">${location.financial.revenue.toLocaleString()}</td>
                    <td className="py-2 text-right">${location.financial.production.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
