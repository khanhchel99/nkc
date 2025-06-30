"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";

type WholesaleOrder = {
  id: string;
  orderNumber: string;
  status: string;
  priority: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  company: {
    id: string;
    name: string;
    code: string;
    contactEmail: string;
    status: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  notes?: string;
  statusHistoryCount: number;
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_production: 'bg-purple-100 text-purple-800',
  quality_check: 'bg-orange-100 text-orange-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function WholesaleOrdersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: "",
    status: undefined as string | undefined,
    companyId: "",
    page: 1,
    limit: 20,
  });

  // Fetch wholesale orders
  const { data: ordersData, isLoading, refetch } = api.orderManagement.getWholesaleOrders.useQuery(filters);

  // Fetch combined statistics
  const { data: stats } = api.orderManagement.getCombinedOrderStats.useQuery();

  const orders = ordersData?.orders ?? [];
  const pagination = ordersData?.pagination;

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wholesale orders...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Wholesale Order Management</h1>
              <p className="text-gray-600 mt-1">
                {pagination?.total || 0} wholesale orders total
              </p>
            </div>
            <div className="flex space-x-4">
              <nav className="flex space-x-4 text-sm">
                <a href="/admin/orders" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                  ← Regular Orders
                </a>
                <a href="/admin" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                  Admin Dashboard
                </a>
              </nav>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.wholesale.total}</div>
                <div className="text-sm text-gray-600">Total Wholesale Orders</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.wholesale.pending}</div>
                <div className="text-sm text-gray-600">Pending Orders</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.wholesale.totalValue)}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.wholesale.avgValue)}
                </div>
                <div className="text-sm text-gray-600">Average Order Value</div>
              </div>
            </div>
          )}

          {/* Combined Stats Comparison */}
          {stats && (
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Order System Comparison</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Regular Orders</div>
                  <div className="text-xl font-bold text-blue-600">{stats.regular.total}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(stats.regular.totalValue)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Wholesale Orders</div>
                  <div className="text-xl font-bold text-purple-600">{stats.wholesale.total}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(stats.wholesale.totalValue)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-2">Combined Total</div>
                  <div className="text-xl font-bold text-green-600">{stats.combined.total}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(stats.combined.totalValue)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  placeholder="Order number, company, user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_production">In Production</option>
                  <option value="quality_check">Quality Check</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-end space-x-2">
                <button
                  onClick={() => setFilters({
                    search: "",
                    status: undefined,
                    companyId: "",
                    page: 1,
                    limit: 20,
                  })}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => refetch()}
                  className="px-4 py-2 bg-[#895D35] text-white rounded-md hover:bg-[#7A4F2A]"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="container mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">{order.user.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.company.name}</div>
                        <div className="text-sm text-gray-500">{order.company.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          PRIORITY_COLORS[order.priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {order.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.itemCount} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.actualDelivery ? (
                        <span className="text-green-600">Delivered {formatDate(order.actualDelivery)}</span>
                      ) : order.estimatedDelivery ? (
                        <span>Est. {formatDate(order.estimatedDelivery)}</span>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/wholesale-orders/${order.id}`)}
                        className="text-[#895D35] hover:text-[#7A4F2A] font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} results
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm bg-[#895D35] text-white rounded-md">
                    {pagination.page}
                  </span>
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
