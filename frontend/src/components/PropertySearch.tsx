'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  MapPinIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  HomeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { debounce } from 'lodash';

interface PropertySearchProps {
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
  className?: string;
}

interface SearchFilters {
  query?: string;
  location?: string;
  propertyTypes?: string[];
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  amenities?: string[];
  features?: string[];
  petFriendly?: boolean;
  furnished?: boolean;
  availableFrom?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment', icon: '🏢' },
  { value: 'HOUSE', label: 'House', icon: '🏠' },
  { value: 'CONDO', label: 'Condo', icon: '🏘️' },
  { value: 'TOWNHOUSE', label: 'Townhouse', icon: '🏘️' },
  { value: 'STUDIO', label: 'Studio', icon: '🏠' },
  { value: 'DUPLEX', label: 'Duplex', icon: '🏠' }
];

const POPULAR_AMENITIES = [
  'Swimming Pool', 'Fitness Center', 'Parking', 'Pet Friendly', 
  'Laundry', 'Air Conditioning', 'Dishwasher', 'Balcony'
];

const SORT_OPTIONS = [
  { value: 'CREATED_AT', label: 'Newest First' },
  { value: 'RENT_AMOUNT', label: 'Price: Low to High' },
  { value: 'RENT_AMOUNT_DESC', label: 'Price: High to Low' },
  { value: 'SQUARE_FOOTAGE', label: 'Size: Largest First' },
  { value: 'BEDROOMS', label: 'Bedrooms' }
];

export const PropertySearch: React.FC<PropertySearchProps> = ({
  onSearch,
  onClear,
  loading = false,
  className = ''
}) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters: SearchFilters) => {
      onSearch(searchFilters);
    }, 300),
    [onSearch]
  );

  // Update filters and trigger search
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    debouncedSearch(updatedFilters);
  };

  // Handle price range updates
  const updatePriceRange = (field: 'min' | 'max', value: string) => {
    const newRange = { ...priceRange, [field]: value };
    setPriceRange(newRange);
    
    const numericValue = value ? parseInt(value) : undefined;
    updateFilters({
      [field === 'min' ? 'minRent' : 'maxRent']: numericValue
    });
  };

  // Clear all filters
  const handleClear = () => {
    setFilters({});
    setPriceRange({ min: '', max: '' });
    onClear();
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.location) count++;
    if (filters.propertyTypes?.length) count++;
    if (filters.minRent || filters.maxRent) count++;
    if (filters.minBedrooms || filters.maxBedrooms) count++;
    if (filters.amenities?.length) count++;
    if (filters.petFriendly) count++;
    if (filters.furnished) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Main Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-3">
          {/* Search Query */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties, neighborhoods, or features..."
              value={filters.query || ''}
              onChange={(e) => updateFilters({ query: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Location Search */}
          <div className="relative min-w-[250px]">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="City, state, or zip code"
              value={filters.location || ''}
              onChange={(e) => updateFilters({ location: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROPERTY_TYPES.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.propertyTypes?.includes(type.value) || false}
                      onChange={(e) => {
                        const currentTypes = filters.propertyTypes || [];
                        const newTypes = e.target.checked
                          ? [...currentTypes, type.value]
                          : currentTypes.filter(t => t !== type.value);
                        updateFilters({ propertyTypes: newTypes });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{type.icon} {type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Price Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => updatePriceRange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="py-2 text-gray-500">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => updatePriceRange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <HomeIcon className="h-4 w-4 inline mr-1" />
                Bedrooms
              </label>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateFilters({ minBedrooms: num })}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      filters.minBedrooms === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {num === 0 ? 'Studio' : num === 5 ? '5+' : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>
              <div className="flex gap-1">
                {[1, 1.5, 2, 2.5, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateFilters({ minBathrooms: num })}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      filters.minBathrooms === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {num === 4 ? '4+' : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <SparklesIcon className="h-4 w-4 inline mr-1" />
                Quick Features
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.petFriendly || false}
                    onChange={(e) => updateFilters({ petFriendly: e.target.checked || undefined })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">🐕 Pet Friendly</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.furnished || false}
                    onChange={(e) => updateFilters({ furnished: e.target.checked || undefined })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">🛋️ Furnished</span>
                </label>
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy || 'CREATED_AT'}
                onChange={(e) => updateFilters({ sortBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Popular Amenities */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Popular Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => {
                    const currentAmenities = filters.amenities || [];
                    const newAmenities = currentAmenities.includes(amenity)
                      ? currentAmenities.filter(a => a !== amenity)
                      : [...currentAmenities, amenity];
                    updateFilters({ amenities: newAmenities });
                  }}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    filters.amenities?.includes(amenity)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="p-4 bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
            </span>
            <button
              onClick={handleClear}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertySearch;