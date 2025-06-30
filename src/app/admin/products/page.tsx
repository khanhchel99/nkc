"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import Image from "next/image";
import type { Decimal } from "@prisma/client/runtime/library";

type Product = {
  id: string;
  nameEn: string;
  nameVi: string;
  slug: string;
  price: Decimal;
  wholesalePrice?: Decimal | null;
  originalPrice?: Decimal | null;
  stock: number;
  inStock: boolean;
  featured: boolean;
  images: string[];
  room: string;
  type: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  categoryRef?: {
    nameEn: string;
    nameVi: string;
  } | null;
  subcategoryRef?: {
    nameEn: string;
    nameVi: string;
  } | null;
};

export default function AdminProductsPage() {
  const router = useRouter();
  
  // State for filters and pagination
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    subcategoryId: "",
    room: "",
    type: "",
    inStock: undefined as boolean | undefined,
    featured: undefined as boolean | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    page: 1,
    limit: 20,
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // API queries
  const { data: productsData, isLoading, refetch } = api.productManagement.getProducts.useQuery(filters);
  const { data: filterOptions } = api.productManagement.getFilterOptions.useQuery();
  const { data: stats } = api.productManagement.getProductStats.useQuery();

  // Mutations
  const deleteProduct = api.productManagement.deleteProduct.useMutation({
    onSuccess: () => {
      refetch();
      setToast({ message: 'Product deleted successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error) => {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const bulkUpdate = api.productManagement.bulkUpdateProducts.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedProducts([]);
      setToast({ message: 'Products updated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error) => {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const products = productsData?.products ?? [];
  const pagination = productsData?.pagination;

  // Filter handlers
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      categoryId: "",
      subcategoryId: "",
      room: "",
      type: "",
      inStock: undefined,
      featured: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 20,
    });
  };

  // Selection handlers
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(products.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  // Bulk actions
  const handleBulkUpdate = (updates: any) => {
    if (selectedProducts.length === 0) return;
    
    bulkUpdate.mutate({
      productIds: selectedProducts,
      updates,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProduct.mutate({ id: productId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1">
                {pagination?.total || 0} products total
              </p>
            </div>
            <div className="flex space-x-4">
              <nav className="flex space-x-4 text-sm">
                <a href="/admin" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                  ← Admin Dashboard
                </a>
              </nav>
              <button
                onClick={() => router.push('/admin/products/new')}
                className="px-6 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Product</span>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
                <div className="text-sm text-blue-700">Total Products</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.inStockProducts}</div>
                <div className="text-sm text-green-700">In Stock</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</div>
                <div className="text-sm text-red-700">Out of Stock</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.featuredProducts}</div>
                <div className="text-sm text-yellow-700">Featured</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts}</div>
                <div className="text-sm text-orange-700">Low Stock</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
              />
            </div>
            
            <select
              value={filters.categoryId}
              onChange={(e) => updateFilters({ categoryId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
            >
              <option value="">All Categories</option>
              {filterOptions?.categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nameEn}</option>
              ))}
            </select>

            <select
              value={filters.room}
              onChange={(e) => updateFilters({ room: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
            >
              <option value="">All Rooms</option>
              {filterOptions?.rooms.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>

            <select
              value={filters.inStock === undefined ? "" : filters.inStock.toString()}
              onChange={(e) => updateFilters({ 
                inStock: e.target.value === "" ? undefined : e.target.value === "true"
              })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
            >
              <option value="">All Stock</option>
              <option value="true">In Stock</option>
              <option value="false">Out of Stock</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
            >
              Clear Filters
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">
                  {selectedProducts.length} product(s) selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkUpdate({ inStock: true })}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Mark In Stock
                  </button>
                  <button
                    onClick={() => handleBulkUpdate({ inStock: false })}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Mark Out of Stock
                  </button>
                  <button
                    onClick={() => handleBulkUpdate({ featured: true })}
                    className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                  >
                    Mark Featured
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No products found</h2>
            <p className="text-gray-600 mb-6">No products match the current filters.</p>
            <button
              onClick={() => router.push('/admin/products/new')}
              className="px-6 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Table Header */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={() => selectedProducts.length === products.length ? clearSelection() : selectAllProducts()}
                    className="h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300 rounded"
                  />
                  <span className="ml-3 font-medium text-gray-700">Select All</span>
                </div>
              </div>

              {/* Products List */}
              <div className="divide-y divide-gray-200">
                {products.map((product: Product) => (
                  <div key={product.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="mt-4 h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300 rounded"
                      />

                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt={product.nameEn}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {product.nameEn}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">{product.nameVi}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {product.room}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {product.type}
                              </span>
                              {product.categoryRef && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                  {product.categoryRef.nameEn}
                                </span>
                              )}
                              {product.featured && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                                  Featured
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs rounded ${
                                product.inStock 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {product.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>

                          {/* Price and Actions */}
                          <div className="flex flex-col items-end space-y-2">
                            <div className="text-right">
                              <div className="text-lg font-bold text-[#895D35]">
                                ${Number(product.price).toFixed(2)}
                              </div>
                              {product.wholesalePrice && (
                                <div className="text-sm text-gray-600">
                                  Wholesale: ${Number(product.wholesalePrice).toFixed(2)}
                                </div>
                              )}
                              <div className="text-sm text-gray-500">
                                Stock: {product.stock}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => window.open(`/catalogue/${product.slug}`, '_blank')}
                                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} products
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + Math.max(1, pagination.page - 2);
                    if (page > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setFilters(prev => ({ ...prev, page }))}
                        className={`px-3 py-1 border rounded text-sm transition ${
                          page === pagination.page
                            ? 'bg-[#895D35] text-white border-[#895D35]'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
