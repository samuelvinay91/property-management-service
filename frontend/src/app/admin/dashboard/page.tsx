'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  UsersIcon,
  HomeIcon,
  CreditCardIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Mock data - replace with real GraphQL queries
const mockData = {
  overview: {
    totalUsers: 1247,
    totalProperties: 523,
    activeLeases: 401,
    monthlyRevenue: 1250000,
    pendingMaintenance: 23,
    overduePayments: 8,
  },
  revenueData: [
    { month: 'Jan', revenue: 1100000, expenses: 250000 },
    { month: 'Feb', revenue: 1150000, expenses: 280000 },
    { month: 'Mar', revenue: 1200000, expenses: 270000 },
    { month: 'Apr', revenue: 1180000, expenses: 290000 },
    { month: 'May', revenue: 1250000, expenses: 300000 },
    { month: 'Jun', revenue: 1300000, expenses: 310000 },
  ],
  userGrowth: [
    { month: 'Jan', users: 950 },
    { month: 'Feb', users: 1020 },
    { month: 'Mar', users: 1100 },
    { month: 'Apr', users: 1150 },
    { month: 'May', users: 1200 },
    { month: 'Jun', users: 1247 },
  ],
  propertyTypes: [
    { name: 'Apartments', value: 45, color: '#3B82F6' },
    { name: 'Houses', value: 30, color: '#10B981' },
    { name: 'Condos', value: 20, color: '#F59E0B' },
    { name: 'Townhouses', value: 5, color: '#8B5CF6' },
  ],
  recentActivity: [
    {
      id: '1',
      type: 'user_registered',
      message: 'New user registered: Jane Smith',
      timestamp: '2024-01-15T10:30:00Z',
      severity: 'info',
    },
    {
      id: '2',
      type: 'payment_failed',
      message: 'Payment failed for property #123',
      timestamp: '2024-01-15T09:15:00Z',
      severity: 'error',
    },
    {
      id: '3',
      type: 'maintenance_completed',
      message: 'Maintenance request #456 completed',
      timestamp: '2024-01-15T08:45:00Z',
      severity: 'success',
    },
    {
      id: '4',
      type: 'property_added',
      message: 'New property added: Downtown Loft',
      timestamp: '2024-01-14T16:20:00Z',
      severity: 'info',
    },
  ],
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState('6m');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <UsersIcon className="w-5 h-5 text-blue-500" />;
      case 'payment_failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'maintenance_completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'property_added':
        return <HomeIcon className="w-5 h-5 text-indigo-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your property management platform</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(mockData.overview.totalUsers)}</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <UsersIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(mockData.overview.totalProperties)}</p>
                <p className="text-sm text-green-600">+8% from last month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <HomeIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(mockData.overview.monthlyRevenue)}</p>
                <p className="text-sm text-green-600">+15% from last month</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <BanknotesIcon className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Leases</p>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(mockData.overview.activeLeases)}</p>
                <p className="text-sm text-green-600">+5% from last month</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CreditCardIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Overdue Payments</h3>
                <p className="text-gray-600">{mockData.overview.overduePayments} payments require immediate attention</p>
                <button className="mt-2 text-red-600 hover:text-red-800 font-medium text-sm">
                  View Details →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <WrenchScrewdriverIcon className="w-6 h-6 text-yellow-500 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Maintenance</h3>
                <p className="text-gray-600">{mockData.overview.pendingMaintenance} requests awaiting assignment</p>
                <button className="mt-2 text-yellow-600 hover:text-yellow-800 font-medium text-sm">
                  View Requests →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h3>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="6m">Last 6 months</option>
                <option value="12m">Last 12 months</option>
                <option value="24m">Last 24 months</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockData.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="expenses" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">User Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Types */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Property Types</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mockData.propertyTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockData.propertyTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {mockData.propertyTypes.map((type, index) => (
                <div key={type.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{type.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{type.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                View All
              </button>
            </div>
            <div className="space-y-4">
              {mockData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{getRelativeTime(activity.timestamp)}</p>
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