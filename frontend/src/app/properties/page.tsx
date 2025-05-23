'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import PropertyCard from '@/components/PropertyCard';
import PropertySearch from '@/components/PropertySearch';
import { 
  MapIcon, 
  ViewColumnsIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// GraphQL Query
const SEARCH_PROPERTIES = gql`
  query SearchProperties($input: PropertySearchInput!) {
    searchProperties(input: $input) {
      properties {
        id
        title
        description
        rentAmount
        securityDeposit
        bedrooms
        bathrooms
        squareFootage
        fullAddress
        propertyType
        availableDate
        images {
          id
          url
          alt
          isPrimary
        }
        amenities {
          id
          name
          category
        }
        isAvailable
        isFeatured
        viewCount
      }
      total
      hasNextPage
      hasPreviousPage
      totalPages
    }
  }
`;

const FEATURED_PROPERTIES = gql`
  query FeaturedProperties($limit: Int) {
    featuredProperties(limit: $limit) {
      id
      title
      description
      rentAmount
      bedrooms
      bathrooms
      squareFootage
      fullAddress
      propertyType
      images {
        id
        url
        alt
        isPrimary
      }
      amenities {
        id
        name
        category
      }
      isAvailable
      isFeatured
      viewCount
    }
  }
`;

interface SearchFilters {
  query?: string;
  location?: string;
  propertyTypes?: string[];
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  amenities?: string[];
  petFriendly?: boolean;
  furnished?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export default function PropertiesPage() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    page: 1,
    limit: 12,
    sortBy: 'CREATED_AT'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [favoriteProperties, setFavoriteProperties] = useState<Set<string>>(new Set());

  // Main search query
  const { data, loading, error, refetch } = useQuery(SEARCH_PROPERTIES, {
    variables: { input: searchFilters },
    errorPolicy: 'all'
  });

  // Featured properties for empty state
  const { data: featuredData, loading: featuredLoading } = useQuery(FEATURED_PROPERTIES, {
    variables: { limit: 6 },
    skip: searchFilters.query || searchFilters.location || Object.keys(searchFilters).length > 3
  });

  const properties = data?.searchProperties?.properties || [];
  const searchResults = data?.searchProperties;
  const featuredProperties = featuredData?.featuredProperties || [];

  // Show featured properties when no search is active
  const shouldShowFeatured = !searchFilters.query && !searchFilters.location && 
    Object.keys(searchFilters).length <= 3 && featuredProperties.length > 0;

  const displayProperties = shouldShowFeatured ? featuredProperties : properties;

  // Handle search
  const handleSearch = (filters: SearchFilters) => {
    const newFilters = { ...filters, page: 1, limit: 12 };
    setSearchFilters(newFilters);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchFilters({ page: 1, limit: 12, sortBy: 'CREATED_AT' });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setSearchFilters(prev => ({ ...prev, page: newPage }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle favorite toggle
  const handleFavorite = (propertyId: string) => {
    setFavoriteProperties(prev => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
    // TODO: Make API call to save favorite
  };

  // Handle share
  const handleShare = (propertyId: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this property',
        url: `${window.location.origin}/properties/${propertyId}`
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/properties/${propertyId}`);
      // TODO: Show success toast
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {shouldShowFeatured ? 'Featured Properties' : 'Property Search'}
              </h1>
              <p className="mt-1 text-gray-600">
                {shouldShowFeatured 
                  ? 'Discover our handpicked featured properties'
                  : searchResults 
                    ? `${searchResults.total.toLocaleString()} properties found`
                    : 'Find your perfect rental property'
                }
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ViewColumnsIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PropertySearch
          onSearch={handleSearch}
          onClear={handleClearSearch}
          loading={loading}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Loading State */}
        {(loading || featuredLoading) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Search Error</h3>
            <p className="mt-1 text-sm text-gray-500">
              There was an error searching for properties. Please try again.
            </p>
            <div className="mt-6">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && displayProperties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or browse our featured properties.
            </p>
            <button
              onClick={handleClearSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && displayProperties.length > 0 && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onFavorite={handleFavorite}
                  onShare={handleShare}
                  isFavorited={favoriteProperties.has(property.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {searchResults && searchResults.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {searchFilters.page || 1} of {searchResults.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange((searchFilters.page || 1) - 1)}
                    disabled={!searchResults.hasPreviousPage}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange((searchFilters.page || 1) + 1)}
                    disabled={!searchResults.hasNextPage}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <MapIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map View Coming Soon</h3>
            <p className="text-gray-600">
              Interactive map view with property markers will be available soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}