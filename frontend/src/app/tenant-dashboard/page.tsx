'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { 
  HomeIcon,
  CreditCardIcon,
  WrenchScrewdriverIcon,
  DocumentTextIcon,
  CalendarIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { GET_TENANT_DASHBOARD } from '@/lib/graphql/queries';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface DashboardData {
  currentLease: {
    id: string;
    property: {
      id: string;
      title: string;
      address: string;
      images: Array<{ url: string }>;
    };
    startDate: string;
    endDate: string;
    rentAmount: number;
    securityDeposit: number;
  };
  upcomingPayments: Array<{
    id: string;
    amount: number;
    dueDate: string;
    status: string;
    type: string;
  }>;
  maintenanceRequests: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
}

export default function TenantDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');

  const { data, loading, error } = useQuery(GET_TENANT_DASHBOARD);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading dashboard</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const dashboardData: DashboardData = data?.tenantDashboard || {
    currentLease: null,
    upcomingPayments: [],
    maintenanceRequests: [],
    notifications: [],
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600">Here's what's happening with your tenancy</p>
        </div>

        {/* Current Property Card */}
        {dashboardData.currentLease && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Current Property</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {dashboardData.currentLease.property.images?.[0] ? (
                      <OptimizedImage
                        src={dashboardData.currentLease.property.images[0].url}
                        alt={dashboardData.currentLease.property.title}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <HomeIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {dashboardData.currentLease.property.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{dashboardData.currentLease.property.address}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Lease: {new Date(dashboardData.currentLease.startDate).toLocaleDateString()} - {new Date(dashboardData.currentLease.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Monthly Rent</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboardData.currentLease.rentAmount.toLocaleString()}</p>
                </div>
                <Link
                  href={`/properties/${dashboardData.currentLease.property.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Property Details
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/tenant-dashboard/payments"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <CreditCardIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Pay Rent</h3>
            <p className="text-sm text-gray-600">Make a payment</p>
          </Link>

          <Link
            href="/tenant-dashboard/maintenance"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <WrenchScrewdriverIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Maintenance</h3>
            <p className="text-sm text-gray-600">Submit request</p>
          </Link>

          <Link
            href="/tenant-dashboard/documents"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <DocumentTextIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Documents</h3>
            <p className="text-sm text-gray-600">View lease</p>
          </Link>

          <Link
            href="/tenant-dashboard/schedule"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <CalendarIcon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Schedule</h3>
            <p className="text-sm text-gray-600">Book viewing</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Payments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Payments</h2>
                <Link href="/tenant-dashboard/payments" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.upcomingPayments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <CreditCardIcon className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">${payment.amount.toLocaleString()}</h3>
                        <p className="text-sm text-gray-600">{payment.type} - Due {new Date(payment.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
                {dashboardData.upcomingPayments.length === 0 && (
                  <p className="text-gray-600 text-center py-4">No upcoming payments</p>
                )}
              </div>
            </div>

            {/* Recent Maintenance Requests */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Maintenance Requests</h2>
                <Link href="/tenant-dashboard/maintenance" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {dashboardData.maintenanceRequests.slice(0, 3).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <WrenchScrewdriverIcon className="w-8 h-8 text-gray-400 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">{request.title}</h3>
                        <p className="text-sm text-gray-600">Submitted {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </div>
                    </div>
                  </div>
                ))}
                {dashboardData.maintenanceRequests.length === 0 && (
                  <p className="text-gray-600 text-center py-4">No maintenance requests</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <BellIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-3">
                {dashboardData.notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                    <div className="flex items-start">
                      {notification.type === 'warning' && (
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      {notification.type === 'success' && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      {notification.type === 'info' && (
                        <ClockIcon className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {dashboardData.notifications.length === 0 && (
                  <p className="text-gray-600 text-center py-4">No new notifications</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Property Manager</h3>
                  <p className="text-sm text-gray-600">John Smith</p>
                  <p className="text-sm text-gray-600">(555) 123-4567</p>
                  <p className="text-sm text-gray-600">john@propflow.com</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Emergency</h3>
                  <p className="text-sm text-gray-600">(555) 999-0000</p>
                </div>
                <button className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}