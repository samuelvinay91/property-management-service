'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { 
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { GET_PAYMENTS } from '@/lib/graphql/queries';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DataTable } from '@/components/ui/DataTable';

type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

interface Payment {
  id: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  type: string;
  description: string;
  tenant: {
    firstName: string;
    lastName: string;
  };
  property: {
    title: string;
    address: string;
  };
  createdAt: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  PENDING: ClockIcon,
  COMPLETED: CheckCircleIcon,
  FAILED: XCircleIcon,
  REFUNDED: ClockIcon,
};

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, loading, error } = useQuery(GET_PAYMENTS, {
    variables: {
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    },
  });

  const handleCreatePayment = () => {
    setShowCreateModal(true);
  };

  const columns = [
    {
      header: 'Amount',
      accessorKey: 'amount',
      cell: ({ row }: any) => (
        <div className="font-medium text-gray-900">
          ${row.original.amount.toLocaleString()}
        </div>
      ),
    },
    {
      header: 'Tenant',
      accessorKey: 'tenant',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.original.tenant.firstName} {row.original.tenant.lastName}
          </div>
        </div>
      ),
    },
    {
      header: 'Property',
      accessorKey: 'property',
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.property.title}</div>
          <div className="text-sm text-gray-600">{row.original.property.address}</div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ row }: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {row.original.type}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessorKey: 'dueDate',
      cell: ({ row }: any) => (
        <div className="text-sm text-gray-900">
          {new Date(row.original.dueDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => {
        const StatusIcon = statusIcons[row.original.status as PaymentStatus];
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[row.original.status as PaymentStatus]}`}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {row.original.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
            View
          </button>
          {row.original.status === 'PENDING' && (
            <button className="text-green-600 hover:text-green-900 text-sm font-medium">
              Process
            </button>
          )}
        </div>
      ),
    },
  ];

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error loading payments</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const payments = data?.payments || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">Manage rent payments and financial transactions</p>
          </div>
          <button
            onClick={handleCreatePayment}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Payment
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Collected</h3>
                <p className="text-2xl font-bold text-green-600">$125,400</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending</h3>
                <p className="text-2xl font-bold text-yellow-600">$8,200</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Overdue</h3>
                <p className="text-2xl font-bold text-red-600">$3,100</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
                <p className="text-2xl font-bold text-blue-600">$24,800</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALL')}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Export
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            data={payments}
            columns={columns}
            searchKey="description"
            emptyMessage="No payments found"
          />
        </div>

        {/* Create Payment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Payment</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tenant</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Select tenant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Payment description..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}