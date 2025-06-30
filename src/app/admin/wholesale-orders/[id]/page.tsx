"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import Image from "next/image";
import InspectionPhotosButton from "@/components/InspectionPhotosButton";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Shipping Information Component
function ShippingInfoSection({ orderId }: { orderId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  
  const { data: shippingInfo, refetch } = api.orderManagement.getShippingInfo.useQuery({
    orderId
  });

  const updateShippingMutation = api.orderManagement.updateShippingInfo.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditing(false);
    }
  });

  const handleEdit = () => {
    setFormData(shippingInfo || {});
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateShippingMutation.mutateAsync({
        orderId,
        ...formData,
        etd: formData.etd ? new Date(formData.etd) : undefined,
        eta: formData.eta ? new Date(formData.eta) : undefined,
        actualDeparture: formData.actualDeparture ? new Date(formData.actualDeparture) : undefined,
        actualArrival: formData.actualArrival ? new Date(formData.actualArrival) : undefined,
      });
    } catch (error) {
      console.error('Failed to update shipping info:', error);
      alert('Failed to update shipping information');
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Shipping Information</h2>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-[#895D35] text-white rounded-md hover:bg-[#7A4F2A]"
          >
            {shippingInfo ? 'Edit' : 'Add'} Shipping Info
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSave}
              disabled={updateShippingMutation.isPending}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {updateShippingMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        shippingInfo ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {shippingInfo.vesselName && (
              <div>
                <label className="font-medium text-gray-700">Vessel Name</label>
                <div>{shippingInfo.vesselName}</div>
              </div>
            )}
            {shippingInfo.vesselIMO && (
              <div>
                <label className="font-medium text-gray-700">IMO Number</label>
                <div>{shippingInfo.vesselIMO}</div>
              </div>
            )}
            {shippingInfo.portOfLoading && (
              <div>
                <label className="font-medium text-gray-700">Port of Loading</label>
                <div>{shippingInfo.portOfLoading}</div>
              </div>
            )}
            {shippingInfo.portOfDischarge && (
              <div>
                <label className="font-medium text-gray-700">Port of Discharge</label>
                <div>{shippingInfo.portOfDischarge}</div>
              </div>
            )}
            {shippingInfo.etd && (
              <div>
                <label className="font-medium text-gray-700">ETD</label>
                <div>{formatDate(shippingInfo.etd)}</div>
              </div>
            )}
            {shippingInfo.eta && (
              <div>
                <label className="font-medium text-gray-700">ETA</label>
                <div>{formatDate(shippingInfo.eta)}</div>
              </div>
            )}
            {shippingInfo.containerNumber && (
              <div>
                <label className="font-medium text-gray-700">Container Number</label>
                <div>{shippingInfo.containerNumber}</div>
              </div>
            )}
            {shippingInfo.billOfLading && (
              <div>
                <label className="font-medium text-gray-700">Bill of Lading</label>
                <div>{shippingInfo.billOfLading}</div>
              </div>
            )}
            {shippingInfo.notes && (
              <div className="col-span-full">
                <label className="font-medium text-gray-700">Notes</label>
                <div>{shippingInfo.notes}</div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">No shipping information available</p>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vessel Name</label>
            <input
              type="text"
              value={formData.vesselName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, vesselName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IMO Number</label>
            <input
              type="text"
              value={formData.vesselIMO || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, vesselIMO: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port of Loading</label>
            <input
              type="text"
              value={formData.portOfLoading || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, portOfLoading: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port of Discharge</label>
            <input
              type="text"
              value={formData.portOfDischarge || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, portOfDischarge: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ETD</label>
            <input
              type="date"
              value={formatDate(formData.etd)}
              onChange={(e) => setFormData(prev => ({ ...prev, etd: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ETA</label>
            <input
              type="date"
              value={formatDate(formData.eta)}
              onChange={(e) => setFormData(prev => ({ ...prev, eta: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Container Number</label>
            <input
              type="text"
              value={formData.containerNumber || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, containerNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill of Lading</label>
            <input
              type="text"
              value={formData.billOfLading || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, billOfLading: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_OPTIONS = [
  'pending',
  'confirmed', 
  'in_production',
  'quality_check',
  'shipped',
  'delivered',
  'cancelled',
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_production: 'bg-purple-100 text-purple-800',
  quality_check: 'bg-orange-100 text-orange-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function WholesaleOrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: '',
  });

  // Fetch order details
  const { data: orderData, isLoading, refetch } = api.orderManagement.getWholesaleOrderDetails.useQuery({
    id: resolvedParams.id,
  });

  // Update status mutation
  const updateStatus = api.orderManagement.updateWholesaleOrderStatus.useMutation({
    onSuccess: () => {
      refetch();
      setIsUpdatingStatus(false);
      setStatusForm({ status: '', notes: '' });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
    },
  });

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = () => {
    if (statusForm.status) {
      updateStatus.mutate({
        id: resolvedParams.id,
        status: statusForm.status,
        notes: statusForm.notes,
      });
    }
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

  if (!orderData?.order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <button
            onClick={() => router.push('/admin/wholesale-orders')}
            className="px-4 py-2 bg-[#895D35] text-white rounded-md hover:bg-[#7A4F2A]"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const { order, timeline } = orderData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order {order.orderNumber}</h1>
              <p className="text-gray-600 mt-1">
                {order.company.name} • Created {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsUpdatingStatus(true)}
                className="px-4 py-2 bg-[#895D35] text-white rounded-md hover:bg-[#7A4F2A]"
              >
                Update Status
              </button>
              <button
                onClick={() => router.push('/admin/wholesale-orders')}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Order Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Priority</label>
                  <div className="mt-1 text-sm font-medium">{order.priority}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Total Amount</label>
                  <div className="mt-1 text-lg font-semibold">{formatCurrency(order.totalAmount, order.currency)}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Items</label>
                  <div className="mt-1 text-sm font-medium">{order.items.length} items</div>
                </div>
              </div>
              
              {order.notes && (
                <div className="mt-4">
                  <label className="text-sm text-gray-500">Notes</label>
                  <div className="mt-1 text-sm">{order.notes}</div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                        {item.specifications && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>Specifications:</strong> {JSON.stringify(item.specifications)}
                          </div>
                        )}
                        {item.notes && (
                          <div className="mt-1 text-sm text-gray-600">
                            <strong>Notes:</strong> {item.notes}
                          </div>
                        )}
                        {/* Inspection Photos Button */}
                        <div className="mt-3">
                          <InspectionPhotosButton 
                            orderId={order.id} 
                            itemId={item.id} 
                            productName={item.product.name}
                            mode="upload"
                          />
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                        <div className="text-sm text-gray-500">Unit: {formatCurrency(item.unitPrice, order.currency)}</div>
                        <div className="font-medium">{formatCurrency(item.totalPrice, order.currency)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <ShippingInfoSection orderId={order.id} />

            {/* Financial Records */}
            {order.financialRecords && order.financialRecords.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Financial Records</h2>
                <div className="space-y-3">
                  {order.financialRecords.map((record) => (
                    <div key={record.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div>
                        <div className="font-medium">{record.description}</div>
                        <div className="text-sm text-gray-500">{formatDate(record.createdAt)}</div>
                      </div>
                      <div className={`font-medium ${
                        record.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {record.type === 'credit' ? '+' : '-'}{formatCurrency(record.amount, record.currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Company Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Company</label>
                  <div className="font-medium">{order.company.name}</div>
                  <div className="text-sm text-gray-500">{order.company.code}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Contact</label>
                  <div className="text-sm">{order.company.contactEmail}</div>
                  <div className="text-sm text-gray-500">{order.company.address}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Order Placed By</label>
                  <div className="text-sm">{order.user.name}</div>
                  <div className="text-sm text-gray-500">{order.user.email}</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.id} className="relative">
                    {index !== timeline.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
                    )}
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                        event.color === 'blue' ? 'bg-blue-500' :
                        event.color === 'green' ? 'bg-green-500' :
                        event.color === 'yellow' ? 'bg-yellow-500' :
                        event.color === 'red' ? 'bg-red-500' :
                        event.color === 'purple' ? 'bg-purple-500' :
                        event.color === 'orange' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}>
                        {event.icon === 'plus' ? '+' :
                         event.icon === 'refresh' ? '↻' :
                         event.icon === 'currency-dollar' ? '$' : '•'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{event.title}</div>
                        <div className="text-sm text-gray-500">{event.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatDate(event.timestamp)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {isUpdatingStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Update Order Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
                >
                  <option value="">Select status...</option>
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#895D35]"
                  placeholder="Add notes about this status change..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleStatusUpdate}
                disabled={!statusForm.status || updateStatus.isPending}
                className="flex-1 px-4 py-2 bg-[#895D35] text-white rounded-md hover:bg-[#7A4F2A] disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={() => setIsUpdatingStatus(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
