'use client';

import { useState } from 'react';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ReportMetric {
  id: string;
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: any;
}

interface Report {
  id: string;
  name: string;
  description: string;
  category: string;
  lastGenerated: string;
  format: 'PDF' | 'Excel' | 'CSV';
}

const revenueData = [
  { month: 'Jan', revenue: 1100000, expenses: 250000, profit: 850000 },
  { month: 'Feb', revenue: 1150000, expenses: 280000, profit: 870000 },
  { month: 'Mar', revenue: 1200000, expenses: 270000, profit: 930000 },
  { month: 'Apr', revenue: 1180000, expenses: 290000, profit: 890000 },
  { month: 'May', revenue: 1250000, expenses: 300000, profit: 950000 },
  { month: 'Jun', revenue: 1300000, expenses: 310000, profit: 990000 },
];

const occupancyData = [
  { month: 'Jan', rate: 85 },
  { month: 'Feb', rate: 88 },
  { month: 'Mar', rate: 92 },
  { month: 'Apr', rate: 89 },
  { month: 'May', rate: 94 },
  { month: 'Jun', rate: 96 },
];

const maintenanceData = [
  { category: 'Plumbing', count: 45, avgCost: 250 },
  { category: 'Electrical', count: 32, avgCost: 180 },
  { category: 'HVAC', count: 28, avgCost: 320 },
  { category: 'Appliances', count: 23, avgCost: 150 },
  { category: 'General', count: 67, avgCost: 120 },
];

const propertyTypeData = [
  { name: 'Apartments', value: 45, revenue: 585000 },
  { name: 'Houses', value: 30, revenue: 390000 },
  { name: 'Condos', value: 20, revenue: 260000 },
  { name: 'Townhouses', value: 5, revenue: 65000 },
];

const metrics: ReportMetric[] = [
  {
    id: 'total_revenue',
    name: 'Total Revenue',
    value: '$7.58M',
    change: '+12.5%',
    changeType: 'positive',
    icon: CurrencyDollarIcon,
  },
  {
    id: 'occupancy_rate',
    name: 'Occupancy Rate',
    value: '94.2%',
    change: '+3.8%',
    changeType: 'positive',
    icon: HomeIcon,
  },
  {
    id: 'active_tenants',
    name: 'Active Tenants',
    value: '1,247',
    change: '+8.7%',
    changeType: 'positive',
    icon: UsersIcon,
  },
  {
    id: 'maintenance_costs',
    name: 'Maintenance Costs',
    value: '$47.2K',
    change: '-5.3%',
    changeType: 'positive',
    icon: WrenchScrewdriverIcon,
  },
];

const availableReports: Report[] = [
  {
    id: 'financial_summary',
    name: 'Financial Summary Report',
    description: 'Comprehensive overview of revenue, expenses, and profitability',
    category: 'Financial',
    lastGenerated: '2024-01-15T10:30:00Z',
    format: 'PDF',
  },
  {
    id: 'occupancy_analysis',
    name: 'Occupancy Analysis',
    description: 'Detailed analysis of occupancy rates and trends',
    category: 'Operations',
    lastGenerated: '2024-01-14T16:20:00Z',
    format: 'Excel',
  },
  {
    id: 'maintenance_report',
    name: 'Maintenance Report',
    description: 'Summary of maintenance requests, costs, and vendor performance',
    category: 'Maintenance',
    lastGenerated: '2024-01-13T09:15:00Z',
    format: 'PDF',
  },
  {
    id: 'tenant_demographics',
    name: 'Tenant Demographics',
    description: 'Analysis of tenant demographics and preferences',
    category: 'Analytics',
    lastGenerated: '2024-01-12T14:45:00Z',
    format: 'CSV',
  },
  {
    id: 'property_performance',
    name: 'Property Performance',
    description: 'Individual property performance metrics and comparisons',
    category: 'Operations',
    lastGenerated: '2024-01-11T11:30:00Z',
    format: 'Excel',
  },
  {
    id: 'payment_analysis',
    name: 'Payment Analysis',
    description: 'Payment patterns, late fees, and collection metrics',
    category: 'Financial',
    lastGenerated: '2024-01-10T15:20:00Z',
    format: 'PDF',
  },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('6m');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const categories = ['All', 'Financial', 'Operations', 'Maintenance', 'Analytics'];

  const filteredReports = selectedCategory === 'All' 
    ? availableReports 
    : availableReports.filter(report => report.category === selectedCategory);

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId);
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate insights and reports for your property portfolio</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="12m">Last 12 Months</option>
            </select>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center">
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Export All
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map(metric => {
            const Icon = metric.icon;
            return (
              <div key={metric.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.name}</p>
                    <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                    <p className={`text-sm ${getChangeColor(metric.changeType)}`}>
                      {metric.change} from last period
                    </p>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Icon className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="2"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.6}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Occupancy Rate */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Occupancy Rate Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[80, 100]} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Maintenance Analysis */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Maintenance by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={maintenanceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Property Type Distribution */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Property Type</h3>
            <div className="flex items-center space-x-8">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={propertyTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {propertyTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {propertyTypeData.map((type, index) => (
                  <div key={type.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{type.name}</div>
                        <div className="text-xs text-gray-600">{type.value}% of portfolio</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(type.revenue)}
                      </div>
                      <div className="text-xs text-gray-600">revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Available Reports */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Available Reports</h3>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map(report => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{report.name}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {report.category}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {report.format}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Last generated: {formatDate(report.lastGenerated)}
                    </div>
                    <button
                      onClick={() => handleGenerateReport(report.id)}
                      disabled={isGenerating === report.id}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating === report.id ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}