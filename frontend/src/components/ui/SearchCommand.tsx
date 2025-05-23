'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useLazyQuery } from '@apollo/client';
import { SEARCH_ALL } from '@/lib/graphql/queries';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchCommand() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  
  const [searchAll, { data, loading }] = useLazyQuery(SEARCH_ALL);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length > 2) {
      searchAll({ variables: { query: debouncedQuery } });
    }
  }, [debouncedQuery, searchAll]);

  return (
    <div className="relative w-full max-w-lg">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-300"
          placeholder="Search properties, tenants, bookings..."
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>

      {/* Search results dropdown */}
      {isOpen && query.length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-96 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : data?.search ? (
            <div className="py-2">
              {/* Properties */}
              {data.search.properties?.length > 0 && (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Properties
                  </h3>
                  {data.search.properties.map((property: any) => (
                    <div key={property.id} className="mt-1 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {property.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {property.address.city}, {property.address.state}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tenants */}
              {data.search.tenants?.length > 0 && (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Tenants
                  </h3>
                  {data.search.tenants.map((tenant: any) => (
                    <div key={tenant.id} className="mt-1 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tenant.firstName} {tenant.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tenant.email}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Show empty state if no results */}
              {(!data.search.properties?.length && !data.search.tenants?.length && !data.search.bookings?.length && !data.search.maintenanceRequests?.length) && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No results found
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Start typing to search...
            </div>
          )}
        </div>
      )}
    </div>
  );
}