'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { 
  BuildingOfficeIcon,
  PlusIcon,
  MapPinIcon,
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DataTable, Column } from '@/components/ui/DataTable';
import { GET_PROPERTIES } from '@/lib/graphql/queries';
import { PropertyType, PropertyStatus } from '@/types';

interface Property {
  id: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  units: Array<{
    id: string;
    number: string;
    rentAmount: number;
    isOccupied: boolean;
  }>;
  description?: string;
  yearBuilt?: number;
  totalSquareFootage?: number;
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
}

const StatusBadge = ({ status }: { status: PropertyStatus }) => {
  const colors = {
    [PropertyStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [PropertyStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
    [PropertyStatus.MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
      {status}
    </span>
  );
};

const PropertyTypeIcon = ({ type }: { type: PropertyType }) => {
  const icons = {
    [PropertyType.APARTMENT]: '🏢',
    [PropertyType.HOUSE]: '🏠',
    [PropertyType.CONDO]: '🏘️',
    [PropertyType.TOWNHOUSE]: '🏡',
    [PropertyType.COMMERCIAL]: '🏬',
    [PropertyType.OTHER]: '🏗️',
  };

  return <span className="text-lg mr-2">{icons[type]}</span>;
};

const ActionButtons = ({ property }: { property: Property }) => (
  <div className="flex items-center space-x-2">
    <button
      className="p-1 text-blue-600 hover:text-blue-800"
      title="View Details"
    >
      <EyeIcon className="h-4 w-4" />
    </button>
    <button
      className="p-1 text-green-600 hover:text-green-800"
      title="Edit Property"
    >
      <PencilIcon className="h-4 w-4" />
    </button>
    <button
      className="p-1 text-red-600 hover:text-red-800"
      title="Delete Property"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  </div>
);

export default function PropertiesManagePage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, loading, error } = useQuery(GET_PROPERTIES);

  const properties: Property[] = data?.properties || [];

  const columns: Column<Property>[] = [
    {
      key: 'name',
      header: 'Property Name',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center">
          <PropertyTypeIcon type={row.type} />
          <div>
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">
              {row.address.street}, {row.address.city}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="capitalize">{value.toLowerCase().replace('_', ' ')}</span>
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
      key: 'units',
      header: 'Units',
      sortable: true,
      render: (units) => {
        const totalUnits = units?.length || 0;
        const occupiedUnits = units?.filter((unit: any) => unit.isOccupied).length || 0;
        const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
        
        return (
          <div className="text-sm">
            <div className="font-medium">{occupiedUnits}/{totalUnits} occupied</div>
            <div className="text-gray-500">{occupancyRate}% occupancy</div>
          </div>
        );
      }
    },
    {
      key: 'units',
      header: 'Revenue',
      sortable: true,
      render: (units) => {
        const totalRevenue = units?.reduce((sum: number, unit: any) => 
          sum + (unit.isOccupied ? unit.rentAmount : 0), 0) || 0;
        const potentialRevenue = units?.reduce((sum: number, unit: any) => 
          sum + unit.rentAmount, 0) || 0;
        
        return (
          <div className="text-sm">
            <div className="font-medium">${totalRevenue.toLocaleString()}</div>
            <div className="text-gray-500">of ${potentialRevenue.toLocaleString()}</div>
          </div>
        );
      }
    },
    {
      key: 'yearBuilt',
      header: 'Year Built',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'totalSquareFootage',
      header: 'Square Feet',
      sortable: true,
      render: (value) => value ? value.toLocaleString() : 'N/A'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => <ActionButtons property={row} />
    }
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-600">Error loading properties: {error.message}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-2">Manage your property portfolio</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Properties</h3>
              <p className="text-2xl font-semibold text-gray-900">{properties.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <HomeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Units</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {properties.reduce((sum, prop) => sum + (prop.units?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Occupied Units</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {properties.reduce((sum, prop) => 
                  sum + (prop.units?.filter(unit => unit.isOccupied).length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-emerald-100">
              <CurrencyDollarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
              <p className="text-2xl font-semibold text-gray-900">
                ${properties.reduce((sum, prop) => 
                  sum + (prop.units?.reduce((unitSum, unit) => 
                    unitSum + (unit.isOccupied ? unit.rentAmount : 0), 0) || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        data={properties}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search properties..."
        emptyMessage="No properties found"
        emptyIcon={BuildingOfficeIcon}
        onRowClick={(property) => {
          // Navigate to property details
          console.log('View property:', property.id);
        }}
      />

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Property</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowCreateModal(false);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Property Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property Type</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option value={PropertyType.APARTMENT}>Apartment</option>
                    <option value={PropertyType.HOUSE}>House</option>
                    <option value={PropertyType.CONDO}>Condo</option>
                    <option value={PropertyType.TOWNHOUSE}>Townhouse</option>
                    <option value={PropertyType.COMMERCIAL}>Commercial</option>
                    <option value={PropertyType.OTHER}>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option value={PropertyStatus.ACTIVE}>Active</option>
                    <option value={PropertyStatus.INACTIVE}>Inactive</option>
                    <option value={PropertyStatus.MAINTENANCE}>Under Maintenance</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Year Built</label>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Total Square Footage</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  />
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
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}