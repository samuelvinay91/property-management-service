'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client';
import { 
  MapPinIcon, 
  BuildingOfficeIcon, 
  HomeIcon, 
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShareIcon,
  HeartIcon,
  CameraIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { GET_PROPERTY_DETAILS } from '@/lib/graphql/queries';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { data, loading, error } = useQuery(GET_PROPERTY_DETAILS, {
    variables: { id: params.id },
  });

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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property not found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/properties')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const property = data?.property;
  if (!property) return null;

  const handleContactOwner = () => {
    // TODO: Implement contact functionality
    console.log('Contact owner');
  };

  const handleScheduleViewing = () => {
    // TODO: Implement scheduling functionality
    router.push(`/properties/${property.id}/schedule`);
  };

  const handleApplyNow = () => {
    // TODO: Implement application functionality
    router.push(`/properties/${property.id}/apply`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div className="relative h-96 bg-gray-200">
        {property.images && property.images.length > 0 ? (
          <>
            <OptimizedImage
              src={property.images[currentImageIndex]?.url}
              alt={property.title}
              fill
              className="object-cover"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {property.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
            <button className="absolute top-4 right-4 bg-white/80 p-2 rounded-full hover:bg-white">
              <CameraIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <BuildingOfficeIcon className="w-24 h-24 text-gray-400" />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <HomeIcon className="w-4 h-4 mr-1" />
                      <span>{property.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                      <span>{property.bathrooms} bath</span>
                    </div>
                    <div className="flex items-center">
                      <span>{property.squareFootage} sq ft</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="p-2 rounded-full border border-gray-300 hover:bg-gray-50"
                  >
                    {isWishlisted ? (
                      <HeartSolidIcon className="w-6 h-6 text-red-500" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  <button className="p-2 rounded-full border border-gray-300 hover:bg-gray-50">
                    <ShareIcon className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed">
                {property.description || 'No description available.'}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mr-3" />
                      <span className="text-gray-600">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Property Details</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Property Type:</span>
                      <span className="capitalize">{property.type?.replace('_', ' ').toLowerCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Year Built:</span>
                      <span>{property.yearBuilt || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lot Size:</span>
                      <span>{property.lotSize ? `${property.lotSize} sq ft` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parking:</span>
                      <span>{property.parkingSpaces || 0} spaces</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Financial</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Property Tax:</span>
                      <span>${property.propertyTax?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HOA Fees:</span>
                      <span>${property.hoaFees?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Insurance:</span>
                      <span>${property.insurance?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Pricing Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ${property.rentAmount?.toLocaleString() || property.price?.toLocaleString() || 'N/A'}
                  {property.rentAmount && <span className="text-lg font-normal text-gray-600">/month</span>}
                </div>
                <div className="text-sm text-gray-600">
                  {property.securityDeposit && (
                    <span>Security Deposit: ${property.securityDeposit.toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleApplyNow}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 transition-colors"
                >
                  Apply Now
                </button>
                <button
                  onClick={handleScheduleViewing}
                  className="w-full bg-white text-indigo-600 py-3 px-4 rounded-md font-medium border border-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center"
                >
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Schedule Viewing
                </button>
                <button
                  onClick={handleContactOwner}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <PhoneIcon className="w-5 h-5 mr-2" />
                  Contact Owner
                </button>
              </div>

              {/* Property Owner Info */}
              {property.owner && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-3">Property Owner</h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {property.owner.firstName?.[0]}{property.owner.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {property.owner.firstName} {property.owner.lastName}
                      </div>
                      <div className="text-sm text-gray-600">Property Owner</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {property.owner.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4 mr-2" />
                        <span>{property.owner.phone}</span>
                      </div>
                    )}
                    {property.owner.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <EnvelopeIcon className="w-4 h-4 mr-2" />
                        <span>{property.owner.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Available From:</span>
                    <span className="font-medium">
                      {property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : 'Now'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Lease Term:</span>
                    <span className="font-medium">{property.leaseTerm || '12 months'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pet Policy:</span>
                    <span className="font-medium">{property.petPolicy || 'Ask Owner'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}