'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  CalendarIcon, 
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  UsersIcon 
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GET_DASHBOARD_STATS } from '@/lib/graphql/queries';

interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  totalTenants: number;
  monthlyRevenue: number;
  pendingMaintenance: number;
  upcomingBookings: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <div className="flex items-center">
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { data, loading, error } = useQuery(GET_DASHBOARD_STATS);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (data?.dashboardStats) {
      setStats(data.dashboardStats);
    }
  }, [data]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-600">Error loading dashboard: {error.message}</div>;

  const occupancyRate = stats ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your properties.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={BuildingOfficeIcon}
          title="Total Properties"
          value={stats?.totalProperties || 0}
          color="blue"
        />
        <StatCard
          icon={HomeIcon}
          title="Unit Occupancy"
          value={`${stats?.occupiedUnits || 0}/${stats?.totalUnits || 0}`}
          subtitle={`${occupancyRate}% occupied`}
          color="green"
        />
        <StatCard
          icon={UsersIcon}
          title="Active Tenants"
          value={stats?.totalTenants || 0}
          color="purple"
        />
        <StatCard
          icon={CurrencyDollarIcon}
          title="Monthly Revenue"
          value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={WrenchScrewdriverIcon}
          title="Pending Maintenance"
          value={stats?.pendingMaintenance || 0}
          subtitle="Requests"
          color="orange"
        />
        <StatCard
          icon={CalendarIcon}
          title="Upcoming Bookings"
          value={stats?.upcomingBookings || 0}
          subtitle="This week"
          color="indigo"
        />
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md">
              Add New Property
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md">
              Create Maintenance Request
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md">
              Schedule Inspection
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-4">
            {stats?.recentActivities?.length ? (
              stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activities</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Property Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Occupancy Rate</span>
              <span className="text-sm font-medium">{occupancyRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${occupancyRate}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="text-xs text-gray-500">Avg. Rent</p>
                <p className="text-lg font-semibold">$1,250</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Collection Rate</p>
                <p className="text-lg font-semibold">96%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}