'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPinIcon, 
  HomeIcon, 
  CurrencyDollarIcon,
  CalendarIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    description: string;
    rentAmount: number;
    securityDeposit?: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;
    fullAddress: string;
    propertyType: string;
    availableDate?: string;
    images: Array<{
      id: string;
      url: string;
      alt?: string;
      isPrimary: boolean;
    }>;
    amenities: Array<{
      name: string;
      category: string;
    }>;
    isAvailable: boolean;
    isFeatured: boolean;
    viewCount: number;
  };
  onFavorite?: (propertyId: string) => void;
  onShare?: (propertyId: string) => void;
  isFavorited?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onFavorite,
  onShare,
  isFavorited = false,
  showActions = true,
  compact = false
}) => {
  const primaryImage = property.images.find(img => img.isPrimary) || property.images[0];
  
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Available Now';
    const date = new Date(dateString);
    return `Available ${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })}`;
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'apartment':
        return '🏢';
      case 'house':
        return '🏠';
      case 'condo':
        return '🏘️';
      case 'townhouse':
        return '🏘️';
      case 'studio':
        return '🏠';
      default:
        return '🏠';
    }
  };

  const topAmenities = property.amenities
    .filter(amenity => ['BUILDING', 'UNIT', 'OUTDOOR'].includes(amenity.category))
    .slice(0, 3);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 ${compact ? 'h-auto' : 'h-[480px]'}`}>
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || property.title}
            fill
            className="object-cover transition-transform duration-200 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <HomeIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {property.isFeatured && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Featured
            </span>
          )}
          {!property.isAvailable && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Rented
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => onShare?.(property.id)}
              className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-sm transition-all duration-200"
            >
              <ShareIcon className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => onFavorite?.(property.id)}
              className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-sm transition-all duration-200"
            >
              {isFavorited ? (
                <HeartSolid className="w-4 h-4 text-red-500" />
              ) : (
                <HeartIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        )}

        {/* Image Count */}
        {property.images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
            📷 {property.images.length}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Price and Type */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(property.rentAmount)}
            </span>
            <span className="text-sm text-gray-500">/month</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>{getPropertyTypeIcon(property.propertyType)}</span>
            <span className="capitalize">{property.propertyType}</span>
          </div>
        </div>

        {/* Title */}
        <Link href={`/properties/${property.id}`}>
          <h3 className="font-semibold text-lg text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-1">
            {property.title}
          </h3>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          <span className="line-clamp-1">{property.fullAddress}</span>
        </div>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <span className="font-medium">{property.bedrooms}</span>
            <span>bed{property.bedrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{property.bathrooms}</span>
            <span>bath{property.bathrooms !== 1 ? 's' : ''}</span>
          </div>
          {property.squareFootage && (
            <div className="flex items-center gap-1">
              <span className="font-medium">{property.squareFootage.toLocaleString()}</span>
              <span>sq ft</span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {topAmenities.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {topAmenities.map((amenity, index) => (
                <span
                  key={index}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                >
                  {amenity.name}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {!compact && (
          <>
            {/* Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
              {property.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <CalendarIcon className="w-4 h-4" />
                <span>{formatDate(property.availableDate)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <EyeIcon className="w-4 h-4" />
                <span>{property.viewCount} views</span>
              </div>
            </div>
          </>
        )}

        {/* Call to Action */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <Link href={`/properties/${property.id}`}>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;