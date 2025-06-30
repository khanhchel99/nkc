"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { deleteOrderInspectionPhotos } from "@/lib/supabase";

interface OrderShippingControlProps {
  orderId: string;
  currentStatus: string;
}

export default function OrderShippingControl({ orderId, currentStatus }: OrderShippingControlProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const utils = api.useUtils();
  
  // Check if order is ready to ship
  const { data: shippingStatus, isLoading } = api.orderManagement.checkOrderReadyToShip.useQuery(
    { orderId },
    { enabled: currentStatus !== 'shipped' }
  );

  // Mark order as shipped mutation
  const markShippedMutation = api.orderManagement.markOrderAsShipped.useMutation({
    onSuccess: async (data) => {
      try {
        // Delete photos from Supabase Storage after successful DB update
        if (data.photosToDelete && data.photosToDelete.length > 0) {
          console.log(`Deleting ${data.photosToDelete.length} inspection photos...`);
          await deleteOrderInspectionPhotos(orderId);
          console.log('✅ Inspection photos deleted successfully');
        }
        
        // Refresh the order data
        await utils.orderManagement.getWholesaleOrderDetails.invalidate({ id: orderId });
        
        alert('✅ Order marked as shipped and inspection photos cleaned up!');
      } catch (error) {
        console.error('❌ Error deleting photos:', error);
        alert('⚠️ Order was marked as shipped, but failed to delete photos. Please check manually.');
      }
    },
    onError: (error) => {
      console.error('Error marking order as shipped:', error);
      alert(`❌ Failed to mark order as shipped: ${error.message}`);
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  const handleMarkAsShipped = async () => {
    if (!shippingStatus?.canShip) {
      alert('❌ Cannot ship order: Not all inspection photos are approved');
      return;
    }

    const confirmed = confirm(
      `⚠️ Are you sure you want to mark this order as SHIPPED?\n\n` +
      `This will:\n` +
      `• Change order status to "shipped"\n` +
      `• Delete all ${shippingStatus.totalPhotos} inspection photos from storage\n` +
      `• This action cannot be undone\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    markShippedMutation.mutate({ orderId });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="animate-pulse">Checking shipping status...</div>
      </div>
    );
  }

  if (currentStatus === 'shipped') {
    return (
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-center">
          <div className="text-green-600 mr-2">🚢</div>
          <div>
            <div className="font-medium text-green-800">Order Shipped</div>
            <div className="text-sm text-green-600">Inspection photos have been cleaned up</div>
          </div>
        </div>
      </div>
    );
  }

  if (!shippingStatus) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
      <div className="mb-4">
        <h3 className="font-medium text-blue-800 mb-2">📦 Shipping Readiness</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg text-green-600">{shippingStatus.approvedPhotos}</div>
            <div className="text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-yellow-600">{shippingStatus.pendingPhotos}</div>
            <div className="text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-red-600">{shippingStatus.rejectedPhotos}</div>
            <div className="text-gray-600">Rejected</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-blue-600">{shippingStatus.totalPhotos}</div>
            <div className="text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {shippingStatus.canShip ? (
        <div className="space-y-3">
          <div className="text-green-600 font-medium">✅ Ready to ship!</div>
          <button
            onClick={handleMarkAsShipped}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            {isProcessing ? '🔄 Processing...' : '🚢 Mark as Shipped & Cleanup Photos'}
          </button>
          <div className="text-xs text-gray-500">
            ⚠️ This will permanently delete all inspection photos from storage
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-orange-600 font-medium">⏳ Not ready to ship</div>
          <div className="text-sm text-gray-600">
            {shippingStatus.pendingPhotos > 0 && (
              <div>• {shippingStatus.pendingPhotos} photos pending review</div>
            )}
            {shippingStatus.rejectedPhotos > 0 && (
              <div>• {shippingStatus.rejectedPhotos} photos rejected (need re-inspection)</div>
            )}
            {shippingStatus.totalPhotos === 0 && (
              <div>• No inspection photos uploaded yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
