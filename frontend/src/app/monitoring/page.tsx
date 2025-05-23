'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  ServerIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SystemMetrics {
  timestamp: string;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  requests: {
    total: number;
    errors: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

interface EndpointMetric {
  endpoint: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  slowQueries: number;
}

// Mock data for the monitoring dashboard
const mockSystemHistory: SystemMetrics[] = [
  {
    timestamp: '2024-01-15T08:00:00Z',
    memory: { used: 512, total: 1024, percentage: 50 },
    cpu: { usage: 45, loadAverage: [0.8, 0.9, 1.0] },
    requests: { total: 1250, errors: 15, averageResponseTime: 120, errorRate: 1.2 },
  },
  {
    timestamp: '2024-01-15T09:00:00Z',
    memory: { used: 580, total: 1024, percentage: 57 },
    cpu: { usage: 52, loadAverage: [1.2, 1.1, 1.0] },
    requests: { total: 1420, errors: 22, averageResponseTime: 145, errorRate: 1.5 },
  },
  {
    timestamp: '2024-01-15T10:00:00Z',
    memory: { used: 640, total: 1024, percentage: 63 },
    cpu: { usage: 48, loadAverage: [0.9, 1.0, 1.1] },
    requests: { total: 1680, errors: 18, averageResponseTime: 132, errorRate: 1.1 },
  },
  {
    timestamp: '2024-01-15T11:00:00Z',
    memory: { used: 720, total: 1024, percentage: 70 },
    cpu: { usage: 65, loadAverage: [1.5, 1.3, 1.2] },
    requests: { total: 1890, errors: 35, averageResponseTime: 180, errorRate: 1.9 },
  },
  {
    timestamp: '2024-01-15T12:00:00Z',
    memory: { used: 680, total: 1024, percentage: 66 },
    cpu: { usage: 42, loadAverage: [0.7, 0.8, 0.9] },
    requests: { total: 1650, errors: 12, averageResponseTime: 115, errorRate: 0.7 },
  },
];

const mockEndpointMetrics: EndpointMetric[] = [
  {
    endpoint: 'GET /api/properties',
    requestCount: 5420,
    averageResponseTime: 95,
    errorRate: 0.8,
    slowQueries: 12,
  },
  {
    endpoint: 'POST /api/auth/login',
    requestCount: 3200,
    averageResponseTime: 180,
    errorRate: 2.1,
    slowQueries: 8,
  },
  {
    endpoint: 'GET /api/tenants',
    requestCount: 2800,
    averageResponseTime: 125,
    errorRate: 1.2,
    slowQueries: 5,
  },
  {
    endpoint: 'POST /api/maintenance',
    requestCount: 1200,
    averageResponseTime: 220,
    errorRate: 0.5,
    slowQueries: 15,
  },
  {
    endpoint: 'GET /api/analytics',
    requestCount: 890,
    averageResponseTime: 340,
    errorRate: 0.3,
    slowQueries: 25,
  },
];

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'high_memory_usage',
    severity: 'warning',
    message: 'Memory usage is 78.5%, approaching threshold of 80%',
    timestamp: '2024-01-15T12:15:00Z',
  },
  {
    id: '2',
    type: 'slow_response_time',
    severity: 'warning',
    message: 'Average response time for /api/analytics is 340ms, above 300ms threshold',
    timestamp: '2024-01-15T12:10:00Z',
  },
  {
    id: '3',
    type: 'high_error_rate',
    severity: 'critical',
    message: 'Error rate for /api/auth/login is 2.1%, above 2% threshold',
    timestamp: '2024-01-15T12:05:00Z',
  },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export default function MonitoringPage() {
  const [systemHistory, setSystemHistory] = useState<SystemMetrics[]>(mockSystemHistory);
  const [endpointMetrics, setEndpointMetrics] = useState<EndpointMetric[]>(mockEndpointMetrics);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [systemStatus, setSystemStatus] = useState({
    status: 'healthy',
    score: 85,
    uptime: 2580000, // seconds
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'info': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'info': return <CheckCircleIcon className="w-5 h-5" />;
      default: return <CheckCircleIcon className="w-5 h-5" />;
    }
  };

  const currentMetrics = systemHistory[systemHistory.length - 1];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p className="text-gray-600">Real-time performance and health monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
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

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${
                systemStatus.status === 'healthy' ? 'bg-green-100' :
                systemStatus.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <ServerIcon className={`w-8 h-8 ${getStatusColor(systemStatus.status)}`} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                <p className={`text-sm ${getStatusColor(systemStatus.status)} capitalize`}>
                  {systemStatus.status} - Score: {systemStatus.score}/100
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatUptime(systemStatus.uptime)}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ServerIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.memory.percentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {currentMetrics?.memory.used}MB / {currentMetrics?.memory.total}MB
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CpuChipIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.cpu.usage}%
                </p>
                <p className="text-sm text-gray-500">
                  Load: {currentMetrics?.cpu.loadAverage[0].toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.requests.averageResponseTime}ms
                </p>
                <p className="text-sm text-gray-500">
                  {currentMetrics?.requests.total} requests
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentMetrics?.requests.errorRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {currentMetrics?.requests.errors} errors
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* System Performance Over Time */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">System Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={systemHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: any, name: string) => [
                    typeof value === 'number' ? value.toFixed(1) : value,
                    name
                  ]}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="memory.percentage"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Memory %"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cpu.usage"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="CPU %"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="requests.averageResponseTime"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Response Time (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Request Volume and Errors */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Request Volume & Errors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={systemHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTime}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="requests.total"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Total Requests"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="requests.errorRate"
                  stroke="#EF4444"
                  strokeWidth={3}
                  name="Error Rate %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Endpoint Performance & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Endpoints by Response Time */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Endpoint Performance</h3>
            <div className="space-y-4">
              {endpointMetrics
                .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
                .map((endpoint, index) => (
                  <div key={endpoint.endpoint} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {endpoint.endpoint}
                      </div>
                      <div className="text-xs text-gray-600">
                        {endpoint.requestCount.toLocaleString()} requests
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {endpoint.averageResponseTime}ms
                      </div>
                      <div className={`text-xs ${
                        endpoint.errorRate > 2 ? 'text-red-600' :
                        endpoint.errorRate > 1 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {endpoint.errorRate.toFixed(1)}% errors
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {alerts.length} active
              </span>
            </div>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 border-l-4 rounded-r-lg ${getAlertColor(alert.severity)}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.severity)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium capitalize">
                          {alert.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm mt-1">
                          {alert.message}
                        </div>
                        <div className="text-xs mt-2 opacity-75">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600">No active alerts</p>
                  <p className="text-sm text-gray-500">System is running smoothly</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}