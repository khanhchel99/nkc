"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useWholesaleAuth } from "../../contexts/auth-context";
import InspectionPhotosButton from "@/components/InspectionPhotosButton";
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";

export default function WholesaleOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useWholesaleAuth();
  const resolvedParams = use(params);
  
  const { data: orderData, isLoading, error } = api.orderManagement.getWholesaleOrderDetails.useQuery(
    { id: resolvedParams.id },
    { enabled: !!user }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Order</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => router.push('/wholesale/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!orderData?.order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">The requested order could not be found.</p>
          <button
            onClick={() => router.push('/wholesale/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const order = orderData.order;

  // Calculate overall inspection status from items
  const calculateOrderInspectionStatus = () => {
    if (!order.items || order.items.length === 0) return 'none';
    
    let hasPhotos = false;
    let allReviewed = true;
    let anyRejected = false;
    
    for (const item of order.items) {
      if (item.inspection?.photos && item.inspection.photos.length > 0) {
        hasPhotos = true;
        
        const itemAllReviewed = item.inspection.photos.every(
          (photo: any) => photo.reviewStatus === 'approved' || photo.reviewStatus === 'rejected'
        );
        
        if (!itemAllReviewed) {
          allReviewed = false;
        }
        
        const itemAnyRejected = item.inspection.photos.some(
          (photo: any) => photo.reviewStatus === 'rejected'
        );
        
        if (itemAnyRejected) {
          anyRejected = true;
        }
      } else {
        allReviewed = false;
      }
    }
    
    if (!hasPhotos) return 'none';
    if (allReviewed) return anyRejected ? 'rejected' : 'approved';
    return 'pending';
  };

  // Calculate inspection status for a specific item
  const calculateItemInspectionStatus = (item: any) => {
    if (!item.inspection?.photos || item.inspection.photos.length === 0) {
      return 'none';
    }
    
    const allReviewed = item.inspection.photos.every(
      (photo: any) => photo.reviewStatus === 'approved' || photo.reviewStatus === 'rejected'
    );
    
    if (!allReviewed) {
      return 'pending';
    }
    
    const anyRejected = item.inspection.photos.some(
      (photo: any) => photo.reviewStatus === 'rejected'
    );
    
    return anyRejected ? 'rejected' : 'approved';
  };

  const getInspectionStatusInfo = (inspectionStatus: string) => {
    switch (inspectionStatus) {
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600 bg-yellow-100',
          text: 'Pending Review'
        };
      case 'reviewing':
        return {
          icon: CameraIcon,
          color: 'text-blue-600 bg-blue-100',
          text: 'Under Review'
        };
      case 'approved':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600 bg-green-100',
          text: 'Approved'
        };
      case 'rejected':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-600 bg-red-100',
          text: 'Rejected'
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-600 bg-gray-100',
          text: 'No Inspection'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/wholesale/dashboard')}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{order.orderNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Order placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ${Number(order.totalAmount).toLocaleString()}
              </p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                order.status === "pending" 
                  ? "bg-yellow-100 text-yellow-800" 
                  : "bg-green-100 text-green-800"
              }`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Order Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Estimated Delivery</p>
                <p className="text-lg font-semibold text-gray-900">
                  {order.estimatedDelivery 
                    ? new Date(order.estimatedDelivery).toLocaleDateString()
                    : "TBD"
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{order.priority}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              {(() => {
                const inspectionStatus = calculateOrderInspectionStatus();
                const statusInfo = getInspectionStatusInfo(inspectionStatus);
                const StatusIcon = statusInfo.icon;
                return (
                  <>
                    <StatusIcon className={`h-8 w-8 ${statusInfo.color.split(' ')[0]}`} />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Inspection Status</p>
                      <p className="text-lg font-semibold text-gray-900">{statusInfo.text}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Order Notes</h3>
            <p className="text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {order.items?.map((item: any) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{item.product?.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">SKU: {item.product?.sku}</p>
                      {item.product?.description && (
                        <p className="text-sm text-gray-600 mt-2">{item.product.description}</p>
                      )}
                    </div>
                    
                    <div className="text-right ml-6">
                      <p className="text-lg font-semibold text-gray-900">
                        ${Number(item.unitPrice * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × ${Number(item.unitPrice).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Quantity</p>
                      <p className="text-sm font-medium text-gray-900">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Unit Price</p>
                      <p className="text-sm font-medium text-gray-900">${Number(item.unitPrice).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Inspection Status</p>
                      {(() => {
                        const itemStatus = calculateItemInspectionStatus(item);
                        const statusInfo = getInspectionStatusInfo(itemStatus);
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Inspection Photos Button */}
                  <div className="flex justify-end">
                    <InspectionPhotosButton 
                      orderId={resolvedParams.id} 
                      itemId={item.id}
                      productName={item.product?.name}
                      mode="review" // This enables the review functionality for wholesale users
                    />
                  </div>

                  {item.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-600">Item Notes:</p>
                      <p className="text-sm text-gray-700 mt-1">{item.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
