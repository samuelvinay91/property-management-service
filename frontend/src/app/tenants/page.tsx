'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { 
  UserGroupIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DataTable, Column } from '@/components/ui/DataTable';
import { GET_TENANTS } from '@/lib/graphql/queries';
import { TenantStatus, LeaseStatus } from '@/types';

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: TenantStatus;
  dateOfBirth?: string;
  socialSecurityNumber?: string;
  emergencyContacts: Array<{
    id: string;
    name: string;
    phone: string;
    relationship: string;
  }>;
  leases: Array<{
    id: string;
    status: LeaseStatus;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    securityDeposit: number;
    unit: {
      id: string;
      number: string;
      property: {
        id: string;
        name: string;
      };
    };
  }>;
  applications: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

const StatusBadge = ({ status }: { status: TenantStatus }) => {
  const colors = {
    [TenantStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [TenantStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
    [TenantStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [TenantStatus.TERMINATED]: 'bg-red-100 text-red-800',
  };

  const icons = {
    [TenantStatus.ACTIVE]: CheckCircleIcon,
    [TenantStatus.INACTIVE]: ExclamationCircleIcon,
    [TenantStatus.PENDING]: CalendarIcon,
    [TenantStatus.TERMINATED]: ExclamationCircleIcon,
  };

  const Icon = icons[status];

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
      <Icon className="h-3 w-3 mr-1" />
      {status}
    </span>
  );
};

const LeaseStatusBadge = ({ status }: { status: LeaseStatus }) => {
  const colors = {
    [LeaseStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [LeaseStatus.EXPIRED]: 'bg-red-100 text-red-800',
    [LeaseStatus.TERMINATED]: 'bg-gray-100 text-gray-800',
    [LeaseStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
};

const ActionButtons = ({ tenant }: { tenant: Tenant }) => (
  <div className="flex items-center space-x-2">
    <button
      className="p-1 text-blue-600 hover:text-blue-800"
      title="View Profile"
    >
      <EyeIcon className="h-4 w-4" />
    </button>
    <button
      className="p-1 text-green-600 hover:text-green-800"
      title="Edit Tenant"
    >
      <PencilIcon className="h-4 w-4" />
    </button>
  </div>
);

export default function TenantsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, loading, error } = useQuery(GET_TENANTS);

  const tenants: Tenant[] = data?.tenants || [];

  const columns: Column<Tenant>[] = [
    {
      key: 'firstName',
      header: 'Tenant',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
            {row.firstName?.[0]}{row.lastName?.[0]}
          </div>
          <div className="ml-4">
            <div className="font-medium text-gray-900">{row.firstName} {row.lastName}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <EnvelopeIcon className="h-3 w-3 mr-1" />
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Contact',
      render: (value, row) => (
        <div className="text-sm">
          {row.phone && (
            <div className="flex items-center text-gray-900">
              <PhoneIcon className="h-3 w-3 mr-1" />
              {row.phone}
            </div>
          )}
          <div className="flex items-center text-gray-500 mt-1">
            <EnvelopeIcon className="h-3 w-3 mr-1" />
            {row.email}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'leases',
      header: 'Current Lease',
      render: (leases) => {
        const activeLease = leases?.find((lease: any) => lease.status === LeaseStatus.ACTIVE);
        if (!activeLease) return <span className="text-gray-500">No active lease</span>;
        
        return (
          <div className="text-sm">
            <div className="font-medium flex items-center">
              <HomeIcon className="h-3 w-3 mr-1" />
              {activeLease.unit.property.name} - Unit {activeLease.unit.number}
            </div>
            <div className="text-gray-500">
              ${activeLease.monthlyRent.toLocaleString()}/month
            </div>
            <div className="text-gray-500">
              Ends: {new Date(activeLease.endDate).toLocaleDateString()}
            </div>
          </div>
        );
      }
    },
    {
      key: 'leases',
      header: 'Lease Status',
      sortable: true,
      render: (leases) => {
        const activeLease = leases?.find((lease: any) => lease.status === LeaseStatus.ACTIVE);
        if (!activeLease) return <span className="text-gray-500">-</span>;
        
        const today = new Date();
        const endDate = new Date(activeLease.endDate);
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) {
          return <LeaseStatusBadge status={LeaseStatus.EXPIRED} />;
        } else if (daysUntilExpiry <= 30) {
          return (
            <div>
              <LeaseStatusBadge status={activeLease.status} />
              <div className="text-xs text-orange-600 mt-1">
                Expires in {daysUntilExpiry} days
              </div>
            </div>
          );
        }
        
        return <LeaseStatusBadge status={activeLease.status} />;
      }
    },
    {
      key: 'applications',
      header: 'Applications',
      render: (applications) => (
        <div className="text-sm text-gray-500">
          {applications?.length || 0} total
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => <ActionButtons tenant={row} />
    }
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-600">Error loading tenants: {error.message}</div>;

  const activeTenantsCount = tenants.filter(t => t.status === TenantStatus.ACTIVE).length;
  const pendingTenantsCount = tenants.filter(t => t.status === TenantStatus.PENDING).length;
  const totalLeases = tenants.reduce((sum, t) => sum + (t.leases?.length || 0), 0);
  const activeLeases = tenants.reduce((sum, t) => 
    sum + (t.leases?.filter(l => l.status === LeaseStatus.ACTIVE).length || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-600 mt-2">Manage tenant information and leases</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Tenants</h3>
              <p className="text-2xl font-semibold text-gray-900">{tenants.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Tenants</h3>
              <p className="text-2xl font-semibold text-gray-900">{activeTenantsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Applications</h3>
              <p className="text-2xl font-semibold text-gray-900">{pendingTenantsCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <HomeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Leases</h3>
              <p className="text-2xl font-semibold text-gray-900">{activeLeases}</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={tenants}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search tenants..."
        emptyMessage="No tenants found"
        emptyIcon={UserGroupIcon}
        onRowClick={(tenant) => {
          console.log('View tenant:', tenant.id);
        }}
      />

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Tenant</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowCreateModal(false);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option value={TenantStatus.PENDING}>Pending</option>
                    <option value={TenantStatus.ACTIVE}>Active</option>
                    <option value={TenantStatus.INACTIVE}>Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Phone</label>
                      <input
                        type="tel"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Relationship</label>
                      <input
                        type="text"
                        placeholder="e.g., Spouse, Parent"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Add Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}