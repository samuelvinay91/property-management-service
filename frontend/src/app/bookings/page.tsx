'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UserIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GET_BOOKINGS, CREATE_BOOKING } from '@/lib/graphql/queries';
import { BookingType, BookingStatus, Priority } from '@/types';

interface Booking {
  id: string;
  title: string;
  type: BookingType;
  status: BookingStatus;
  priority: Priority;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  property?: {
    id: string;
    name: string;
  };
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const colors = {
    [BookingStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [BookingStatus.CONFIRMED]: 'bg-green-100 text-green-800',
    [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [BookingStatus.COMPLETED]: 'bg-blue-100 text-blue-800',
    [BookingStatus.NO_SHOW]: 'bg-gray-100 text-gray-800',
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

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[priority]}`}>
      {priority}
    </span>
  );
};

export default function BookingsPage() {
  const [filter, setFilter] = useState<BookingStatus | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_BOOKINGS, {
    variables: { filter: filter === 'ALL' ? undefined : filter }
  });

  const [createBooking] = useMutation(CREATE_BOOKING, {
    onCompleted: () => {
      setShowCreateModal(false);
      refetch();
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-red-600">Error loading bookings: {error.message}</div>;

  const bookings: Booking[] = data?.bookings || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-2">Manage property viewings, inspections, and meetings</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Booking
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as BookingStatus | 'ALL')}
              className="text-sm border-gray-300 rounded-md"
            >
              <option value="ALL">All Bookings</option>
              <option value={BookingStatus.PENDING}>Pending</option>
              <option value={BookingStatus.CONFIRMED}>Confirmed</option>
              <option value={BookingStatus.COMPLETED}>Completed</option>
              <option value={BookingStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No bookings found</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{booking.title}</h3>
                      <StatusBadge status={booking.status} />
                      <PriorityBadge priority={booking.priority} />
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(booking.startTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {booking.location && (
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {booking.location}
                        </div>
                      )}
                    </div>

                    {booking.property && (
                      <p className="text-sm text-gray-600 mb-2">
                        Property: {booking.property.name}
                      </p>
                    )}

                    {booking.description && (
                      <p className="text-sm text-gray-700 mb-3">{booking.description}</p>
                    )}

                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {booking.participants.length} participant{booking.participants.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
                    <button className="text-sm text-red-600 hover:text-red-800">
                      Cancel
                    </button>
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Booking</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle form submission
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
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                    <option value={BookingType.VIEWING}>Property Viewing</option>
                    <option value={BookingType.INSPECTION}>Inspection</option>
                    <option value={BookingType.MAINTENANCE}>Maintenance</option>
                    <option value={BookingType.MEETING}>Meeting</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}