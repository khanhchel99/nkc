"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import Image from "next/image";

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: {
      name: string;
    };
  };
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    product: {
      id: string;
      nameEn: string;
      nameVi: string;
      slug: string;
      images: string[];
    };
  }>;
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  
  // State for filters and pagination
  const [filters, setFilters] = useState({
    search: "",
    status: "" as "" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
    userId: "",
    minTotal: undefined as number | undefined,
    maxTotal: undefined as number | undefined,
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
    page: 1,
    limit: 20,
  });

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // API queries
  const { data: ordersData, isLoading, refetch } = api.orderManagement.getOrders.useQuery(filters);
  const { data: filterOptions } = api.orderManagement.getFilterOptions.useQuery();
  const { data: stats } = api.orderManagement.getOrderStats.useQuery();

  // Mutations
  const updateOrderStatus = api.orderManagement.updateOrderStatus.useMutation({
    onSuccess: () => {
      refetch();
      setToast({ message: 'Order status updated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error) => {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const bulkUpdate = api.orderManagement.bulkUpdateOrders.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedOrders([]);
      setToast({ message: 'Orders updated successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error) => {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const deleteOrder = api.orderManagement.deleteOrder.useMutation({
    onSuccess: () => {
      refetch();
      setToast({ message: 'Order deleted successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (error) => {
      setToast({ message: error.message, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const orders = ordersData?.orders ?? [];
  const pagination = ordersData?.pagination;

  // Filter handlers
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      userId: "",
      minTotal: undefined,
      maxTotal: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
      page: 1,
      limit: 20,
    });
  };

  // Selection handlers
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    setSelectedOrders(orders.map(o => o.id));
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  // Action handlers
  const handleStatusUpdate = (orderId: string, status: string) => {
    updateOrderStatus.mutate({ id: orderId, status: status as any });
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedOrders.length === 0) return;
    bulkUpdate.mutate({
      orderIds: selectedOrders,
      status: status as any,
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      deleteOrder.mutate({ id: orderId });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-1">
                {pagination?.total || 0} orders total
              </p>
            </div>
            <div className="flex space-x-4">
              <nav className="flex space-x-4 text-sm">
                <a href="/admin" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                  ← Admin Dashboard
                </a>
              </nav>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
                <div className="text-sm text-blue-700">Total Orders</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
                <div className="text-sm text-yellow-700">Pending</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{stats.confirmedOrders}</div>
                <div className="text-sm text-indigo-700">Confirmed</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.shippedOrders}</div>
                <div className="text-sm text-purple-700">Shipped</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.deliveredOrders}</div>
                <div className="text-sm text-green-700">Delivered</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</div>
                <div className="text-sm text-red-700">Cancelled</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center col-span-2 md:col-span-2">
                <div className="text-2xl font-bold text-emerald-600">{formatCurrency(Number(stats.totalRevenue))}</div>
                <div className="text-sm text-emerald-700">Total Revenue</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center col-span-2 md:col-span-2">
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(Number(stats.averageOrderValue))}</div>
                <div className="text-sm text-orange-700">Avg Order Value</div>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4 text-center col-span-2 md:col-span-2">
                <div className="text-2xl font-bold text-cyan-600">{stats.recentOrders}</div>
                <div className="text-sm text-cyan-700">Last 30 Days</div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as any })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
            >
              <option value="">All Statuses</option>
              {filterOptions?.statuses.map(status => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                </option>
              ))}
            </select>

            <select
              value={filters.userId}
              onChange={(e) => updateFilters({ userId: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
            >
              <option value="">All Customers</option>
              {filterOptions?.customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name || customer.email}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Min Total"
              value={filters.minTotal || ''}
              onChange={(e) => updateFilters({ minTotal: e.target.value ? Number(e.target.value) : undefined })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
            />

            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
            >
              Clear Filters
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-blue-700">
                  {selectedOrders.length} order(s) selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('confirmed')}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Mark Confirmed
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('shipped')}
                    className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  >
                    Mark Shipped
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('delivered')}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Mark Delivered
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

      {/* Orders List */}
      <div className="container mx-auto px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-600 mb-6">No orders match the current filters.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* Table Header */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length}
                    onChange={() => selectedOrders.length === orders.length ? clearSelection() : selectAllOrders()}
                    className="h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300 rounded"
                  />
                  <span className="ml-3 font-medium text-gray-700">Select All</span>
                </div>
              </div>

              {/* Orders List */}
              <div className="divide-y divide-gray-200">
                {orders.map((order: Order) => (
                  <div key={order.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="mt-4 h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300 rounded"
                      />

                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Order #{order.id.slice(-8)}
                              </h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                                {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {order.user.role.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Customer: {order.user.name || order.user.email}
                            </p>
                            {order.user.phone && (
                              <p className="text-sm text-gray-600">
                                Phone: {order.user.phone}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              Created: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Items: {order.items.length} | Total: {formatCurrency(Number(order.total))}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col space-y-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-[#895D35] focus:border-[#895D35]"
                              disabled={updateOrderStatus.isLoading}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => router.push(`/admin/orders/${order.id}`)}
                                className="px-3 py-1 bg-[#895D35] text-white rounded text-sm hover:bg-[#7A4F2A] transition"
                              >
                                View Details
                              </button>
                              {['pending', 'cancelled'].includes(order.status) && (
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                                  disabled={deleteOrder.isLoading}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                {item.product.images[0] && (
                                  <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                      src={item.product.images[0]}
                                      alt={item.product.nameEn}
                                      width={40}
                                      height={40}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{item.product.nameEn}</p>
                                  <p className="text-xs text-gray-600">
                                    Qty: {item.quantity} × {formatCurrency(Number(item.price))}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="flex items-center justify-center p-2 bg-gray-100 rounded text-xs text-gray-600">
                                +{order.items.length - 3} more items
                              </div>
                            )}
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
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateFilters({ page: pagination.page - 1 })}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-[#895D35] text-white rounded text-sm">
                    {pagination.page}
                  </span>
                  <button
                    onClick={() => updateFilters({ page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

async function getOrders() {
  try {
    // Orders functionality temporarily disabled due to Prisma client issues
    // TODO: Re-enable once Order model is properly available
    /*
    const orders = await db.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: {
              select: {
                name: true
              }
            }
          }
        },
        items: {
          include: {
            product: {
              select: {
                nameEn: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to most recent 20 orders
    });
    return orders;
    */
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

async function getOrderStats() {
  try {
    // Orders functionality temporarily disabled due to Prisma client issues
    // TODO: Re-enable once Order model is properly available in Prisma client
    return {
      totalOrders: 0,
      pendingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      totalRevenue: 0
    };
  } catch (error) {
    console.error('Error fetching order stats:', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      totalRevenue: 0
    };
  }
}

export default async function AdminOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  if (!AuthService.isAdmin(user)) {
    redirect('/profile');
  }

  const [orders, stats] = await Promise.all([
    getOrders(),
    getOrderStats()
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-2">View and manage customer orders</p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/admin"
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </Link>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Export Orders
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Shipped</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.shippedOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Delivered</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.deliveredOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Revenue</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-2">${stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="space-y-2">
                      <p>Order management system is currently being set up.</p>
                      <p className="text-sm">Orders will appear here once the order model is properly configured.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Advanced Order Management Coming Soon
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Order status updates, detailed order views, shipping management, and bulk operations are currently in development.
                  This page shows existing orders from your database.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
