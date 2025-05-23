'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GET_MAINTENANCE_REQUESTS, CREATE_MAINTENANCE_REQUEST } from '@/lib/graphql/queries';
import { MaintenanceStatus, Priority, MaintenanceCategory } from '@/types';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: Priority;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    number: string;
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
}

const StatusBadge = ({ status }: { status: MaintenanceStatus }) => {
  const colors = {
    [MaintenanceStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [MaintenanceStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
    [MaintenanceStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [MaintenanceStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [MaintenanceStatus.ON_HOLD]: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    [Priority.LOW]: 'bg-gray-100 text-gray-800',
    [Priority.MEDIUM]: 'bg-blue-100 text-blue-800',
    [Priority.HIGH]: 'bg-orange-100 text-orange-800',
    [Priority.URGENT]: 'bg-red-100 text-red-800',
  };

  const icons = {
    [Priority.LOW]: null,
    [Priority.MEDIUM]: null,
    [Priority.HIGH]: ExclamationTriangleIcon,
    [Priority.URGENT]: ExclamationTriangleIcon,
  };

  const Icon = icons[priority];

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {priority}
    </span>
  );
};

const CategoryIcon = ({ category }: { category: MaintenanceCategory }) => {
  const icons = {
    [MaintenanceCategory.PLUMBING]: '🔧',
    [MaintenanceCategory.ELECTRICAL]: '⚡',
    [MaintenanceCategory.HVAC]: '❄️',
    [MaintenanceCategory.APPLIANCE]: '📱',
    [MaintenanceCategory.STRUCTURAL]: '🏗️',
    [MaintenanceCategory.LANDSCAPING]: '🌿',
    [MaintenanceCategory.SECURITY]: '🔒',
    [MaintenanceCategory.CLEANING]: '🧹',
    [MaintenanceCategory.OTHER]: '🔨',
  };

  return <span className="text-lg">{icons[category]}</span>;
};

export default function MaintenancePage() {
  const [filter, setFilter] = useState<MaintenanceStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_MAINTENANCE_REQUESTS, {
    variables: { 
      status: filter === 'ALL' ? undefined : filter,
      priority: priorityFilter === 'ALL' ? undefined : priorityFilter
    }
  });

  const [createMaintenanceRequest] = useMutation(CREATE_MAINTENANCE_REQUEST, {
    onCompleted: () => {
      setShowCreateModal(false);
      refetch();
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-600">Error loading maintenance requests: {error.message}</div>;

  const requests: MaintenanceRequest[] = data?.maintenanceRequests || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-600 mt-2">Manage property maintenance and work orders</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Request
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as MaintenanceStatus | 'ALL')}
              className="text-sm border-gray-300 rounded-md"
            >
              <option value="ALL">All Status</option>
              <option value={MaintenanceStatus.PENDING}>Pending</option>
              <option value={MaintenanceStatus.IN_PROGRESS}>In Progress</option>
              <option value={MaintenanceStatus.COMPLETED}>Completed</option>
              <option value={MaintenanceStatus.ON_HOLD}>On Hold</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
              className="text-sm border-gray-300 rounded-md"
            >
              <option value="ALL">All Priorities</option>
              <option value={Priority.URGENT}>Urgent</option>
              <option value={Priority.HIGH}>High</option>
              <option value={Priority.MEDIUM}>Medium</option>
              <option value={Priority.LOW}>Low</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <WrenchScrewdriverIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No maintenance requests found</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CategoryIcon category={request.category} />
                      <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                      <StatusBadge status={request.status} />
                      <PriorityBadge priority={request.priority} />
                    </div>
                    
                    <p className="text-gray-700 mb-3">{request.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      {request.property && (
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                          {request.property.name}
                          {request.unit && ` - Unit ${request.unit.number}`}
                        </div>
                      )}
                      
                      {request.tenant && (
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          {request.tenant.firstName} {request.tenant.lastName}
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Created {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {request.assignedTo && (
                      <div className="flex items-center text-sm text-blue-600 mb-2">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Assigned to {request.assignedTo.name}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      View Details
                    </button>
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                    {request.status === MaintenanceStatus.PENDING && (
                      <button className="text-sm text-green-600 hover:text-green-800">
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create Maintenance Request</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              setShowCreateModal(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option value={MaintenanceCategory.PLUMBING}>Plumbing</option>
                    <option value={MaintenanceCategory.ELECTRICAL}>Electrical</option>
                    <option value={MaintenanceCategory.HVAC}>HVAC</option>
                    <option value={MaintenanceCategory.APPLIANCE}>Appliance</option>
                    <option value={MaintenanceCategory.STRUCTURAL}>Structural</option>
                    <option value={MaintenanceCategory.LANDSCAPING}>Landscaping</option>
                    <option value={MaintenanceCategory.SECURITY}>Security</option>
                    <option value={MaintenanceCategory.CLEANING}>Cleaning</option>
                    <option value={MaintenanceCategory.OTHER}>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option value={Priority.LOW}>Low</option>
                    <option value={Priority.MEDIUM}>Medium</option>
                    <option value={Priority.HIGH}>High</option>
                    <option value={Priority.URGENT}>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
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
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}