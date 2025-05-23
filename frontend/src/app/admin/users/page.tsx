'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  phone?: string;
  properties?: number;
  activeLeases?: number;
}

// Mock data - replace with real GraphQL queries
const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'TENANT',
    status: 'ACTIVE',
    isEmailVerified: true,
    isPhoneVerified: true,
    lastLoginAt: '2024-01-15T10:30:00Z',
    createdAt: '2023-06-15T09:00:00Z',
    phone: '+1234567890',
    activeLeases: 1,
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'PROPERTY_OWNER',
    status: 'ACTIVE',
    isEmailVerified: true,
    isPhoneVerified: false,
    lastLoginAt: '2024-01-14T15:20:00Z',
    createdAt: '2023-03-10T14:30:00Z',
    phone: '+1987654321',
    properties: 5,
  },
  {
    id: '3',
    email: 'mike.johnson@example.com',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'PROPERTY_MANAGER',
    status: 'SUSPENDED',
    isEmailVerified: true,
    isPhoneVerified: true,
    lastLoginAt: '2024-01-10T08:45:00Z',
    createdAt: '2023-01-20T11:15:00Z',
    properties: 12,
  },
];

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = () => {
    if (selectedUser) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleSuspendUser = (user: User) => {
    setUsers(prev => 
      prev.map(u => 
        u.id === user.id 
          ? { ...u, status: u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' as any }
          : u
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'PROPERTY_OWNER':
        return 'bg-blue-100 text-blue-800';
      case 'PROPERTY_MANAGER':
        return 'bg-indigo-100 text-indigo-800';
      case 'TENANT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return formatDate(dateString);
    }
  };

  const columns = [
    {
      header: 'User',
      accessorKey: 'user',
      cell: ({ row }: any) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-medium text-gray-600">
              {row.original.firstName[0]}{row.original.lastName[0]}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-sm text-gray-600">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(row.original.role)}`}>
          {row.original.role.replace('_', ' ')}
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
      header: 'Verification',
      accessorKey: 'verification',
      cell: ({ row }: any) => (
        <div className="flex space-x-1">
          {row.original.isEmailVerified ? (
            <CheckCircleIcon className="w-4 h-4 text-green-500" title="Email verified" />
          ) : (
            <XCircleIcon className="w-4 h-4 text-red-500" title="Email not verified" />
          )}
          {row.original.isPhoneVerified ? (
            <CheckCircleIcon className="w-4 h-4 text-green-500" title="Phone verified" />
          ) : (
            <XCircleIcon className="w-4 h-4 text-red-500" title="Phone not verified" />
          )}
        </div>
      ),
    },
    {
      header: 'Properties/Leases',
      accessorKey: 'counts',
      cell: ({ row }: any) => (
        <div className="text-sm text-gray-900">
          {row.original.role === 'PROPERTY_OWNER' && (
            <span>{row.original.properties || 0} properties</span>
          )}
          {row.original.role === 'PROPERTY_MANAGER' && (
            <span>{row.original.properties || 0} managed</span>
          )}
          {row.original.role === 'TENANT' && (
            <span>{row.original.activeLeases || 0} leases</span>
          )}
        </div>
      ),
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLogin',
      cell: ({ row }: any) => (
        <div className="text-sm text-gray-900">
          {getRelativeTime(row.original.lastLoginAt)}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditUser(row.original)}
            className="text-indigo-600 hover:text-indigo-900"
            title="Edit user"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSuspendUser(row.original)}
            className={`${
              row.original.status === 'SUSPENDED' 
                ? 'text-green-600 hover:text-green-900' 
                : 'text-yellow-600 hover:text-yellow-900'
            }`}
            title={row.original.status === 'SUSPENDED' ? 'Activate user' : 'Suspend user'}
          >
            {row.original.status === 'SUSPENDED' ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleDeleteUser(row.original)}
            className="text-red-600 hover:text-red-900"
            title="Delete user"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage all users in your platform</p>
          </div>
          <button
            onClick={handleCreateUser}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Add User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'ACTIVE').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Property Owners</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'PROPERTY_OWNER').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Tenants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'TENANT').length}
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
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.status === 'SUSPENDED').length}
                </p>
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <FunnelIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="TENANT">Tenants</option>
                  <option value="PROPERTY_OWNER">Property Owners</option>
                  <option value="PROPERTY_MANAGER">Property Managers</option>
                  <option value="ADMIN">Admins</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
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

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            data={filteredUsers}
            columns={columns}
            searchKey="email"
            emptyMessage="No users found"
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDeleteUser}
          title="Delete User"
          message={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      </div>
    </div>
  );
}