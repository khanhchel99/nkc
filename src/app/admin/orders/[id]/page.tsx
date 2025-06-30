"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/trpc/react";
import Image from "next/image";

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

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // API queries
  const { data: order, isLoading, refetch } = api.orderManagement.getOrder.useQuery({ id: orderId });

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

  const handleStatusUpdate = (status: string, notes?: string) => {
    updateOrderStatus.mutate({ id: orderId, status: status as any, notes });
  };

  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#895D35] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order not found</h2>
          <p className="text-gray-600 mb-6">The requested order could not be found.</p>
          <button
            onClick={() => router.push('/admin/orders')}
            className="px-6 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition"
          >
            Back to Orders
          </button>
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
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Order #{order.id.slice(-8)}
                </h1>
                <span className={`px-3 py-1 text-sm rounded-full ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                  {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                </span>
              </div>
              <p className="text-gray-600">
                Created on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
              </p>
              {order.updatedAt !== order.createdAt && (
                <p className="text-gray-600">
                  Last updated: {new Date(order.updatedAt).toLocaleDateString()} at {new Date(order.updatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <nav className="flex space-x-4 text-sm">
                <a href="/admin/orders" className="text-[#895D35] hover:text-[#7A4F2A] font-medium">
                  ← Back to Orders
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{order.user.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-sm text-gray-900">{order.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <p className="text-sm text-gray-900">{order.user.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                  <p className="text-sm text-gray-900">{order.user.role.name}</p>
                </div>
                {order.user.businessProfile && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <p className="text-sm text-gray-900">{order.user.businessProfile.companyName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                      <p className="text-sm text-gray-900">{order.user.businessProfile.taxId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Verified</label>
                      <p className={`text-sm ${order.user.businessProfile.verified ? 'text-green-600' : 'text-red-600'}`}>
                        {order.user.businessProfile.verified ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {item.product.images[0] && (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.nameEn}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.nameEn}</h3>
                      <p className="text-sm text-gray-600">{item.product.nameVi}</p>
                      <p className="text-sm text-gray-600">SKU: {item.product.slug}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {item.quantity} × {formatCurrency(item.price)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Subtotal: {formatCurrency(Number(item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Total */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-[#895D35]">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Actions & Status */}
          <div className="space-y-6">
            
            {/* Status Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                  <span className={`inline-flex px-3 py-1 text-sm rounded-full ${STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}`}>
                    {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#895D35] focus:border-[#895D35]"
                    disabled={updateOrderStatus.isPending}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Quick Status Actions */}
                <div className="grid grid-cols-1 gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate('confirmed')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      disabled={updateOrderStatus.isPending}
                    >
                      Confirm Order
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate('shipped')}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      disabled={updateOrderStatus.isPending}
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      onClick={() => handleStatusUpdate('delivered')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      disabled={updateOrderStatus.isPending}
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {!['delivered', 'cancelled'].includes(order.status) && (
                    <button
                      onClick={() => handleStatusUpdate('cancelled')}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      disabled={updateOrderStatus.isPending}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order ID</span>
                  <span className="text-sm font-medium text-gray-900">#{order.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items</span>
                  <span className="text-sm font-medium text-gray-900">{order.items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer Type</span>
                  <span className="text-sm font-medium text-gray-900">{order.user.role.name}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-base font-medium text-gray-900">Total</span>
                  <span className="text-base font-bold text-[#895D35]">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/admin/users/${order.user.id}`)}
                  className="w-full px-4 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] transition"
                >
                  View Customer Profile
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Print Order
                </button>
                <button
                  onClick={() => router.push('/admin/orders')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Back to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
