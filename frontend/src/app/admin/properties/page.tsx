'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';

interface Property {
  id: string;
  name: string;
  address: string;
  type: 'APARTMENT' | 'HOUSE' | 'CONDO' | 'TOWNHOUSE';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  units: number;
  occupiedUnits: number;
  monthlyRent: number;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  lastInspection?: string;
  maintenanceIssues: number;
  totalRevenue: number;
}

// Mock data
const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Sunset Apartments',
    address: '123 Main St, Downtown, CA 90210',
    type: 'APARTMENT',
    status: 'ACTIVE',
    units: 24,
    occupiedUnits: 22,
    monthlyRent: 2500,
    owner: {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
    },
    manager: {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
    },
    createdAt: '2023-01-15T10:30:00Z',
    lastInspection: '2024-01-10T14:00:00Z',
    maintenanceIssues: 2,
    totalRevenue: 55000,
  },
  {
    id: '2',
    name: 'Green Valley Houses',
    address: '456 Oak Ave, Suburb, CA 90211',
    type: 'HOUSE',
    status: 'ACTIVE',
    units: 12,
    occupiedUnits: 11,
    monthlyRent: 3200,
    owner: {
      id: '2',
      name: 'Jane Doe',
      email: 'jane@example.com',
    },
    createdAt: '2023-03-20T09:00:00Z',
    lastInspection: '2024-01-05T11:30:00Z',
    maintenanceIssues: 0,
    totalRevenue: 35200,
  },
  {
    id: '3',
    name: 'Metro Condos',
    address: '789 Pine St, Midtown, CA 90212',
    type: 'CONDO',
    status: 'MAINTENANCE',
    units: 36,
    occupiedUnits: 32,
    monthlyRent: 2800,
    owner: {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike@example.com',
    },
    manager: {
      id: '2',
      name: 'Tom Brown',
      email: 'tom@example.com',
    },
    createdAt: '2022-11-10T16:20:00Z',
    lastInspection: '2023-12-15T13:45:00Z',
    maintenanceIssues: 5,
    totalRevenue: 89600,
  },
];

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'create'>('view');

  const filteredProperties = properties.filter(property => {
    const matchesSearch = 
      property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.owner.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || property.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || property.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleViewProperty = (property: Property) => {
    setSelectedProperty(property);
    setViewMode('view');
    setShowPropertyModal(true);
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setViewMode('edit');
    setShowPropertyModal(true);
  };

  const handleCreateProperty = () => {
    setSelectedProperty(null);
    setViewMode('create');
    setShowPropertyModal(true);
  };

  const handleDeleteProperty = (property: Property) => {
    if (confirm(`Are you sure you want to delete ${property.name}?`)) {
      setProperties(prev => prev.filter(p => p.id !== property.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'APARTMENT':
        return 'bg-blue-100 text-blue-800';
      case 'HOUSE':
        return 'bg-green-100 text-green-800';
      case 'CONDO':
        return 'bg-purple-100 text-purple-800';
      case 'TOWNHOUSE':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  const getOccupancyRate = (property: Property) => {
    return Math.round((property.occupiedUnits / property.units) * 100);
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const columns = [
    {
      header: 'Property',
      accessorKey: 'property',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center mr-3">
            <HomeIcon className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.name}</div>
            <div className="text-sm text-gray-600 flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1" />
              {row.original.address}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ row }: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(row.original.type)}`}>
          {row.original.type}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.original.status)}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      header: 'Occupancy',
      accessorKey: 'occupancy',
      cell: ({ row }: any) => {
        const rate = getOccupancyRate(row.original);
        return (
          <div className="text-sm">
            <div className={`font-medium ${getOccupancyColor(rate)}`}>
              {rate}%
            </div>
            <div className="text-gray-600">
              {row.original.occupiedUnits}/{row.original.units} units
            </div>
          </div>
        );
      },
    },
    {
      header: 'Monthly Rent',
      accessorKey: 'monthlyRent',
      cell: ({ row }: any) => (
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(row.original.monthlyRent)}
        </div>
      ),
    },
    {
      header: 'Owner',
      accessorKey: 'owner',
      cell: ({ row }: any) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.original.owner.name}</div>
          <div className="text-sm text-gray-600">{row.original.owner.email}</div>
        </div>
      ),
    },
    {
      header: 'Issues',
      accessorKey: 'maintenanceIssues',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          {row.original.maintenanceIssues > 0 ? (
            <>
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-sm text-red-600">{row.original.maintenanceIssues}</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">None</span>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewProperty(row.original)}
            className="text-indigo-600 hover:text-indigo-900"
            title="View property"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditProperty(row.original)}
            className="text-green-600 hover:text-green-900"
            title="Edit property"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteProperty(row.original)}
            className="text-red-600 hover:text-red-900"
            title="Delete property"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const totalProperties = properties.length;
  const activeProperties = properties.filter(p => p.status === 'ACTIVE').length;
  const totalUnits = properties.reduce((sum, p) => sum + p.units, 0);
  const occupiedUnits = properties.reduce((sum, p) => sum + p.occupiedUnits, 0);
  const totalRevenue = properties.reduce((sum, p) => sum + p.totalRevenue, 0);
  const overallOccupancyRate = Math.round((occupiedUnits / totalUnits) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
            <p className="text-gray-600">Manage all properties in your portfolio</p>
          </div>
          <button
            onClick={handleCreateProperty}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Property
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HomeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Properties</p>
                <p className="text-2xl font-bold text-gray-900">{activeProperties}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Units</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Occupancy Rate</p>
                <p className={`text-2xl font-bold ${getOccupancyColor(overallOccupancyRate)}`}>
                  {overallOccupancyRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
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
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Types</option>
                  <option value="APARTMENT">Apartments</option>
                  <option value="HOUSE">Houses</option>
                  <option value="CONDO">Condos</option>
                  <option value="TOWNHOUSE">Townhouses</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Export
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Bulk Actions
              </button>
            </div>
          </div>
        </div>

        {/* Properties Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            data={filteredProperties}
            columns={columns}
            searchKey="name"
            emptyMessage="No properties found"
          />
        </div>

        {/* Property Modal */}
        <Modal
          isOpen={showPropertyModal}
          onClose={() => setShowPropertyModal(false)}
          title={viewMode === 'create' ? 'Add New Property' : 
                 viewMode === 'edit' ? 'Edit Property' : 'Property Details'}
          size="lg"
        >
          <div className="p-6">
            {selectedProperty && viewMode === 'view' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property Name</label>
                    <p className="text-sm text-gray-900">{selectedProperty.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="text-sm text-gray-900">{selectedProperty.type}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="text-sm text-gray-900">{selectedProperty.address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Units</label>
                    <p className="text-sm text-gray-900">{selectedProperty.units} total, {selectedProperty.occupiedUnits} occupied</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedProperty.monthlyRent)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Owner</label>
                    <p className="text-sm text-gray-900">{selectedProperty.owner.name}</p>
                    <p className="text-xs text-gray-600">{selectedProperty.owner.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manager</label>
                    <p className="text-sm text-gray-900">{selectedProperty.manager?.name || 'None assigned'}</p>
                    {selectedProperty.manager && (
                      <p className="text-xs text-gray-600">{selectedProperty.manager.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {(viewMode === 'edit' || viewMode === 'create') && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {viewMode === 'create' ? 'Create a new property' : 'Edit property details'}
                </p>
                {/* Form fields would go here */}
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}