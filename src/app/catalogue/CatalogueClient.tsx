"use client";
import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/trpc/react";
import { useI18n } from "../i18n";

// Simple debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Types
interface FilterState {
  rooms: string[];
  types: string[];
  combos: string[];
  sortBy: 'createdAt' | 'name';
  sortOrder: 'asc' | 'desc';
}

interface PaginationState {
  page: number;
  limit: number;
}

// Loading skeleton component
const ProductSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-48 w-full bg-gray-300"></div>
    <div className="p-4">
      <div className="h-6 bg-gray-300 rounded mb-2"></div>
      <div className="h-4 bg-gray-300 rounded mb-1 w-3/4"></div>
      <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
      <div className="flex justify-between items-center mt-4">
        <div className="h-6 bg-gray-300 rounded w-16"></div>
        <div className="h-8 bg-gray-300 rounded w-24"></div>
      </div>
    </div>
  </div>
);

// Filter sidebar skeleton
const FilterSkeleton = () => (
  <aside className="w-full md:w-64 bg-white rounded-lg shadow-md p-6 mb-8 md:mb-0">
    <div className="h-6 bg-gray-300 rounded mb-4 w-24"></div>
    {[1, 2, 3].map((section) => (
      <div key={section} className="mb-4">
        <div className="h-5 bg-gray-300 rounded mb-2 w-20"></div>
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center mb-1">
            <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
            <div className="h-4 bg-gray-300 rounded w-16"></div>
          </div>
        ))}
      </div>
    ))}
    <div className="h-10 bg-gray-300 rounded w-full"></div>
  </aside>
);

export default function CatalogueClient() {
  const [filters, setFilters] = useState<FilterState>({
    rooms: [],
    types: [],
    combos: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 12
  });

  const { locale, t } = useI18n();

  // Translation helper functions
  const translateRoomType = useCallback((room: string) => {
    const roomMap: Record<string, string> = {
      'Living Room': t("living_room"),
      'Bedroom': t("bedroom"),
      'Kitchen': t("kitchen"),
      'Office': t("office"),
      'Dining Room': t("dining_room")
    };
    return roomMap[room] || room;
  }, [t]);

  const translateFurnitureType = useCallback((type: string) => {
    const typeMap: Record<string, string> = {
      'Sofa': t("sofa"),
      'Bed': t("bed"),
      'Table': t("table"),
      'Chair': t("chair"),
      'Cabinet': t("cabinet"),
      'Desk': t("desk")
    };
    return typeMap[type] || type;
  }, [t]);

  const translateComboType = useCallback((combo: string) => {
    const comboMap: Record<string, string> = {
      'Dining Set': t("dining_set"),
      'Bedroom Combo': t("bedroom_combo"),
      'Living Room Set': t("living_room_set"),
      'Office Set': t("office_set")
    };
    return comboMap[combo] || combo;
  }, [t]);

  // Debounced filter update to avoid too many API calls
  const debouncedFilterUpdate = useMemo(
    () => debounce((newFilters: FilterState) => {
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
    }, 300),
    []
  );

  // API queries
  const { data: filterOptions, isLoading: filterOptionsLoading } = api.product.getFilterOptions.useQuery();
  
  const { 
    data: productsData, 
    isLoading: productsLoading,
    isFetching: productsFetching 
  } = api.product.getAll.useQuery({
    locale,
    page: pagination.page,
    limit: pagination.limit,
    room: filters.rooms.length > 0 ? filters.rooms[0] : undefined, // For now, support single filter
    type: filters.types.length > 0 ? filters.types[0] : undefined,
    combo: filters.combos.length > 0 ? filters.combos[0] : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    inStock: true, // Only show in-stock items
  });

  // Handlers
  const toggleFilter = useCallback((value: string, filterType: keyof Pick<FilterState, 'rooms' | 'types' | 'combos'>) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [value]; // For now, allow only single selection for better performance
      
      const newFilters = { ...prev, [filterType]: newValues };
      debouncedFilterUpdate(newFilters);
      return newFilters;
    });
  }, [debouncedFilterUpdate]);

  const clearFilters = useCallback(() => {
    setFilters({
      rooms: [],
      types: [],
      combos: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSortChange = useCallback((sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Loading states
  if (filterOptionsLoading) {
    return (
      <main className="min-h-screen bg-stone-100 py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8">
          <FilterSkeleton />
          <section className="flex-1">
            <div className="h-8 bg-gray-300 rounded mb-6 w-32"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  const products = productsData?.products || [];
  const paginationInfo = productsData?.pagination;

  return (
    <main className="min-h-screen bg-stone-100 py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 bg-white rounded-lg shadow-md p-6 mb-8 md:mb-0">
          <h2 className="text-xl font-bold mb-4 text-[#895D35]">{t("filters")}</h2>
          
          {/* Sort Options */}
          <div className="mb-6 pb-4 border-b">
            <h3 className="font-semibold mb-2">{t("sort_by") || "Sort By"}</h3>
            <select 
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [FilterState['sortBy'], FilterState['sortOrder']];
                handleSortChange(sortBy, sortOrder);
              }}
              className="w-full p-2 border rounded focus:outline-none focus:border-[#895D35]"
            >
              <option value="createdAt-desc">{t("newest_first") || "Newest First"}</option>
              <option value="createdAt-asc">{t("oldest_first") || "Oldest First"}</option>
              <option value="name-asc">{t("name_a_z") || "Name: A to Z"}</option>
              <option value="name-desc">{t("name_z_a") || "Name: Z to A"}</option>
            </select>
          </div>

          {/* Room Filter */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">{t("room_type")}</h3>
            {filterOptions?.rooms.map(({ value: room, count }) => (
              <label key={room} className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.rooms.includes(room)}
                    onChange={() => toggleFilter(room, 'rooms')}
                    className="mr-2 accent-[#895D35]"
                  />
                  {translateRoomType(room)}
                </div>
                <span className="text-xs text-gray-500">({count})</span>
              </label>
            ))}
          </div>

          {/* Type Filter */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">{t("furniture_type")}</h3>
            {filterOptions?.types.map(({ value: type, count }) => (
              <label key={type} className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => toggleFilter(type, 'types')}
                    className="mr-2 accent-[#895D35]"
                  />
                  {translateFurnitureType(type)}
                </div>
                <span className="text-xs text-gray-500">({count})</span>
              </label>
            ))}
          </div>

          {/* Combo Filter */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">{t("furniture_combo")}</h3>
            {filterOptions?.combos.map(({ value: combo, count }) => (
              <label key={combo} className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.combos.includes(combo)}
                    onChange={() => toggleFilter(combo, 'combos')}
                    className="mr-2 accent-[#895D35]"
                  />
                  {translateComboType(combo)}
                </div>
                <span className="text-xs text-gray-500">({count})</span>
              </label>
            ))}
          </div>

          <button
            onClick={clearFilters}
            className="mt-2 bg-[#895D35] text-white px-4 py-2 rounded hover:bg-[#7A4F2A] w-full font-semibold transition-colors"
          >
            {t("clear_filters")}
          </button>
        </aside>

        {/* Product Grid */}
        <section className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#895D35]">{t("catalogue")}</h1>
            {paginationInfo && (
              <div className="text-sm text-gray-600">
                {t("showing_results") || "Showing"} {((paginationInfo.page - 1) * paginationInfo.limit) + 1}-{Math.min(paginationInfo.page * paginationInfo.limit, paginationInfo.totalCount)} {t("of")} {paginationInfo.totalCount}
              </div>
            )}
          </div>

          {/* Loading state overlay */}
          <div className="relative">
            {productsFetching && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#895D35]"></div>
              </div>
            )}

            {products.length === 0 && !productsLoading ? (
              <div className="text-center text-gray-500 py-16">
                <p>{t("no_products_found")}</p>
                <button 
                  onClick={clearFilters}
                  className="mt-4 text-[#895D35] hover:underline"
                >
                  {t("clear_filters_try_again") || "Clear filters and try again"}
                </button>
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                  {productsLoading ? (
                    Array.from({ length: pagination.limit }).map((_, i) => (
                      <ProductSkeleton key={i} />
                    ))
                  ) : (
                    products.map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/catalogue/${product.slug}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group transform hover:-translate-y-1"
                      >
                        <div className="relative h-48 w-full overflow-hidden">
                          <Image
                            src={product.images?.[0] || "/images/business-slide1.jpg"}
                            alt={product.name}
                            fill
                            style={{ objectFit: "cover" }}
                            className="rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            loading="lazy"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                                {t("out_of_stock") || "Out of Stock"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="text-xl font-semibold mb-2 text-[#895D35] group-hover:text-[#7A4F2A] transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="text-sm text-gray-500 mb-1">
                            {translateRoomType(product.room)} &bull; {translateFurnitureType(product.type)}
                          </div>
                          {product.combo && (
                            <div className="text-xs text-amber-700 mb-2">
                              {translateComboType(product.combo)}
                            </div>
                          )}
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-600">
                                {t("contact_for_pricing")}
                              </span>
                            </div>
                            <span className="bg-[#895D35] text-white px-3 py-1 rounded hover:bg-[#7A4F2A] text-sm font-medium transition-colors group-hover:bg-[#7A4F2A]">
                              {t("view_details")}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {paginationInfo && paginationInfo.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => handlePageChange(paginationInfo.page - 1)}
                      disabled={!paginationInfo.hasPreviousPage}
                      className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      {t("previous") || "Previous"}
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
                      let pageNumber;
                      if (paginationInfo.totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (paginationInfo.page <= 3) {
                        pageNumber = i + 1;
                      } else if (paginationInfo.page >= paginationInfo.totalPages - 2) {
                        pageNumber = paginationInfo.totalPages - 4 + i;
                      } else {
                        pageNumber = paginationInfo.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                            pageNumber === paginationInfo.page
                              ? 'bg-[#895D35] text-white border-[#895D35]'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(paginationInfo.page + 1)}
                      disabled={!paginationInfo.hasNextPage}
                      className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      {t("next") || "Next"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
