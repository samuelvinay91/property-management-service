'use client';

import { useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  UsersIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  ArrowPathIcon,
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
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
} from 'recharts';

// Enhanced mock data for analytics
const revenueGrowthData = [
  { month: 'Jan', revenue: 1100000, growth: 5.2, forecast: 1150000 },
  { month: 'Feb', revenue: 1150000, growth: 4.5, forecast: 1200000 },
  { month: 'Mar', revenue: 1200000, growth: 4.3, forecast: 1250000 },
  { month: 'Apr', revenue: 1180000, growth: -1.7, forecast: 1280000 },
  { month: 'May', revenue: 1250000, growth: 5.9, forecast: 1320000 },
  { month: 'Jun', revenue: 1300000, growth: 4.0, forecast: 1350000 },
  { month: 'Jul', revenue: null, growth: null, forecast: 1380000 },
  { month: 'Aug', revenue: null, growth: null, forecast: 1420000 },
];

const propertyPerformanceData = [
  { property: 'Sunset Apts', revenue: 55000, occupancy: 92, roi: 12.5, maintenance: 2500 },
  { property: 'Green Valley', revenue: 48000, occupancy: 88, roi: 11.2, maintenance: 1800 },
  { property: 'Metro Condos', revenue: 72000, occupancy: 95, roi: 14.1, maintenance: 3200 },
  { property: 'Oak Townhomes', revenue: 38000, occupancy: 85, roi: 9.8, maintenance: 1500 },
  { property: 'Pine Heights', revenue: 65000, occupancy: 91, roi: 13.3, maintenance: 2800 },
];

const tenantSatisfactionData = [
  { quarter: 'Q1 2023', satisfaction: 4.2, retention: 85, complaints: 12 },
  { quarter: 'Q2 2023', satisfaction: 4.4, retention: 88, complaints: 8 },
  { quarter: 'Q3 2023', satisfaction: 4.3, retention: 86, complaints: 10 },
  { quarter: 'Q4 2023', satisfaction: 4.6, retention: 92, complaints: 5 },
  { quarter: 'Q1 2024', satisfaction: 4.7, retention: 94, complaints: 3 },
];

const marketComparisonData = [
  { metric: 'Avg Rent', ourValue: 2800, marketAvg: 2650, difference: 5.7 },
  { metric: 'Occupancy', ourValue: 92, marketAvg: 87, difference: 5.7 },
  { metric: 'Maintenance Cost', ourValue: 180, marketAvg: 220, difference: -18.2 },
  { metric: 'Tenant Satisfaction', ourValue: 4.7, marketAvg: 4.2, difference: 11.9 },
];

const maintenanceTrendsData = [
  { month: 'Jan', emergency: 8, routine: 25, preventive: 15, cost: 12000 },
  { month: 'Feb', emergency: 6, routine: 28, preventive: 18, cost: 14500 },
  { month: 'Mar', emergency: 12, routine: 22, preventive: 16, cost: 16800 },
  { month: 'Apr', emergency: 5, routine: 30, preventive: 20, cost: 13200 },
  { month: 'May', emergency: 9, routine: 26, preventive: 17, cost: 15100 },
  { month: 'Jun', emergency: 7, routine: 24, preventive: 19, cost: 13800 },
];

const portfolioMetrics = [
  { name: 'Portfolio Value', value: 25000000, change: 8.5, icon: HomeIcon },
  { name: 'Monthly Revenue', value: 1300000, change: 4.0, icon: CurrencyDollarIcon },
  { name: 'Active Tenants', value: 1247, change: 2.8, icon: UsersIcon },
  { name: 'Avg ROI', value: 12.8, change: 1.2, icon: TrendingUpIcon },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('12m');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('Revenue') 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600">Deep insights into your property portfolio performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="12m">Last 12 Months</option>
              <option value="24m">Last 24 Months</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              <ArrowPathIcon className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Key Portfolio Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {portfolioMetrics.map((metric) => {
            const Icon = metric.icon;
            const isPositive = metric.change > 0;
            return (
              <div key={metric.name} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.name}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {metric.name.includes('Value') || metric.name.includes('Revenue') 
                        ? formatCurrency(metric.value)
                        : metric.name.includes('ROI')
                        ? `${metric.value}%`
                        : metric.value.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-1">
                      {isPositive ? (
                        <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(metric.change)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-full">
                    <Icon className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Growth & Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Growth & Forecast</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  stroke="#3B82F6"
                  name="Actual Revenue"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="forecast"
                  stroke="#F59E0B"
                  strokeDasharray="5 5"
                  name="Forecast"
                />
                <Bar
                  yAxisId="right"
                  dataKey="growth"
                  fill="#10B981"
                  name="Growth %"
                  opacity={0.7}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Property Performance Scatter */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Property Performance Matrix</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="occupancy" name="Occupancy %" unit="%" />
                <YAxis dataKey="roi" name="ROI" unit="%" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Scatter 
                  name="Properties" 
                  data={propertyPerformanceData} 
                  fill="#8B5CF6"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenant Satisfaction & Market Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tenant Satisfaction Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={tenantSatisfactionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis domain={[3.5, 5]} tickFormatter={(value) => value.toFixed(1)} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  name="Satisfaction Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Comparison</h3>
            <div className="space-y-4">
              {marketComparisonData.map((item, index) => {
                const isPositive = item.difference > 0;
                return (
                  <div key={item.metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 w-32">{item.metric}</div>
                      <div className="text-sm text-gray-600 w-20">
                        {item.metric.includes('Cost') ? formatCurrency(item.ourValue) : 
                         item.metric.includes('Satisfaction') ? item.ourValue.toFixed(1) :
                         item.ourValue}{item.metric.includes('Occupancy') ? '%' : ''}
                      </div>
                      <div className="text-sm text-gray-500 w-20">
                        vs {item.metric.includes('Cost') ? formatCurrency(item.marketAvg) : 
                            item.metric.includes('Satisfaction') ? item.marketAvg.toFixed(1) :
                            item.marketAvg}{item.metric.includes('Occupancy') ? '%' : ''}
                      </div>
                    </div>
                    <div className={`flex items-center ${
                      (item.metric.includes('Cost') ? !isPositive : isPositive) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(item.metric.includes('Cost') ? !isPositive : isPositive) ? (
                        <TrendingUpIcon className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDownIcon className="w-4 h-4 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {formatPercentage(Math.abs(item.difference))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Maintenance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Maintenance Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={maintenanceTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="left" dataKey="emergency" stackId="a" fill="#EF4444" name="Emergency" />
                <Bar yAxisId="left" dataKey="routine" stackId="a" fill="#3B82F6" name="Routine" />
                <Bar yAxisId="left" dataKey="preventive" stackId="a" fill="#10B981" name="Preventive" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  name="Total Cost"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Property Performance Ranking */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Property ROI Ranking</h3>
            <div className="space-y-4">
              {propertyPerformanceData
                .sort((a, b) => b.roi - a.roi)
                .map((property, index) => (
                  <div key={property.property} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{property.property}</div>
                        <div className="text-xs text-gray-600">
                          {property.occupancy}% occupancy
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{property.roi}% ROI</div>
                      <div className="text-xs text-gray-600">{formatCurrency(property.revenue)}/mo</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Predictive Analytics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Predictive Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUpIcon className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-blue-900">Revenue Forecast</h4>
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(1420000)}</p>
              <p className="text-sm text-blue-700">Expected revenue next month (+9.2%)</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <HomeIcon className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-green-900">Occupancy Prediction</h4>
              </div>
              <p className="text-2xl font-bold text-green-900">96.5%</p>
              <p className="text-sm text-green-700">Predicted occupancy rate (+2.5%)</p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CalendarIcon className="w-5 h-5 text-yellow-600 mr-2" />
                <h4 className="text-sm font-medium text-yellow-900">Maintenance Alert</h4>
              </div>
              <p className="text-2xl font-bold text-yellow-900">15</p>
              <p className="text-sm text-yellow-700">Properties due for inspection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}