import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TrendingUp, Users, MapPin, Activity } from 'lucide-react';
import { getStatsFromAPI as getStats } from '../utils/api';
import type { Stats } from '../utils/api';

const routeUsageData = [
  { name: 'Mon', routes: 45, users: 120 },
  { name: 'Tue', routes: 52, users: 145 },
  { name: 'Wed', routes: 49, users: 138 },
  { name: 'Thu', routes: 63, users: 167 },
  { name: 'Fri', routes: 71, users: 189 },
  { name: 'Sat', routes: 58, users: 156 },
  { name: 'Sun', routes: 42, users: 112 },
];




const crowdReportsData = [
  { week: 'Week 1', reports: 23, verified: 18 },
  { week: 'Week 2', reports: 31, verified: 25 },
  { week: 'Week 3', reports: 28, verified: 22 },
  { week: 'Week 4', reports: 35, verified: 29 },
];

function getModeData(modeDistribution?: Record<string, number>) {
  const colorMap: Record<string, string> = {
    bus: '#6A0DAD',
    auto: '#CBA0F5',
    walk: '#B57EDC',
    bike: '#8B2DC2',
  };

  const nameMap: Record<string, string> = {
    bus: 'Bus',
    auto: 'Shared Auto',
    walk: 'Walking',
    bike: 'Bike',
  };

  if (!modeDistribution) {
    return [
      { name: 'Bus', value: 1, color: '#6A0DAD' },
      { name: 'Shared Auto', value: 1, color: '#CBA0F5' },
      { name: 'Walking', value: 1, color: '#B57EDC' },
      { name: 'Bike', value: 1, color: '#8B2DC2' },
    ];
  }

  return Object.entries(modeDistribution).map(([mode, value]) => ({
    name: nameMap[mode] || mode,
    value,
    color: colorMap[mode] || '#E6E6FA',
  }));
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { stats: data } = await getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <Card className="p-12 border-[#E6E6FA] text-center">
          <div className="w-12 h-12 border-2 border-[#6A0DAD] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[#6A0DAD] mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600">Monitor platform usage and route optimization metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 border-[#E6E6FA] bg-gradient-to-br from-white to-[#F5F3FF]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-[#6A0DAD] rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>
          </div>
          <div className="text-2xl text-[#6A0DAD] mb-1">
            {stats?.totalRoutes.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">Total Routes Generated</div>
        </Card>

        <Card className="p-5 border-[#E6E6FA] bg-gradient-to-br from-white to-[#F5F3FF]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-[#CBA0F5] rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">+8%</span>
          </div>
          <div className="text-2xl text-[#6A0DAD] mb-1">
            {stats?.activeUsers.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </Card>

        <Card className="p-5 border-[#E6E6FA] bg-gradient-to-br from-white to-[#F5F3FF]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-[#B57EDC] rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">+15%</span>
          </div>
          <div className="text-2xl text-[#6A0DAD] mb-1">
            {stats?.villagesCovered || 0}
          </div>
          <div className="text-sm text-gray-600">Villages Covered</div>
        </Card>

        <Card className="p-5 border-[#E6E6FA] bg-gradient-to-br from-white to-[#F5F3FF]">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 bg-[#8B2DC2] rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">+22%</span>
          </div>
          <div className="text-2xl text-[#6A0DAD] mb-1">
            {stats?.totalReports || 0}
          </div>
          <div className="text-sm text-gray-600">Crowd Reports</div>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="usage" className="mb-8">
        <TabsList className="bg-[#E6E6FA] border-[#CBA0F5] mb-6">
          <TabsTrigger value="usage" className="data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white">
            Route Usage
          </TabsTrigger>
          <TabsTrigger value="modes" className="data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white">
            Transport Modes
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-[#6A0DAD] data-[state=active]:text-white">
            Crowd Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          <Card className="p-6 border-[#E6E6FA]">
            <h3 className="text-[#6A0DAD] mb-6">Weekly Route Generation & User Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={routeUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E6FA" />
                <XAxis dataKey="name" stroke="#6A0DAD" />
                <YAxis stroke="#6A0DAD" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#F5F3FF', 
                    border: '1px solid #CBA0F5',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="routes" stroke="#6A0DAD" strokeWidth={2} name="Routes Generated" />
                <Line type="monotone" dataKey="users" stroke="#CBA0F5" strokeWidth={2} name="Active Users" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="modes">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-[#E6E6FA]">
              <h3 className="text-[#6A0DAD] mb-6">Transport Mode Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getModeData(stats?.modeDistribution)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getModeData(stats?.modeDistribution).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6 border-[#E6E6FA]">
              <h3 className="text-[#6A0DAD] mb-6">Mode Usage Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getModeData(stats?.modeDistribution)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E6E6FA" />
                  <XAxis dataKey="name" stroke="#6A0DAD" />
                  <YAxis stroke="#6A0DAD" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#F5F3FF', 
                      border: '1px solid #CBA0F5',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="#6A0DAD" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-6 border-[#E6E6FA]">
            <h3 className="text-[#6A0DAD] mb-6">Crowd Report Submissions & Verification</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={crowdReportsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E6FA" />
                <XAxis dataKey="week" stroke="#6A0DAD" />
                <YAxis stroke="#6A0DAD" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#F5F3FF', 
                    border: '1px solid #CBA0F5',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="reports" fill="#CBA0F5" radius={[8, 8, 0, 0]} name="Total Reports" />
                <Bar dataKey="verified" fill="#6A0DAD" radius={[8, 8, 0, 0]} name="Verified" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
