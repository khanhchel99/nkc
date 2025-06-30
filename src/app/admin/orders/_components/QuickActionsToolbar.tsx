"use client";
import { useState } from "react";

interface QuickActionsToolbarProps {
  selectedOrderCount: number;
  onBulkAction: (action: string) => void;
  onRefresh: () => void;
  onShowAnalytics: () => void;
  onShowExport: () => void;
  totalOrders: number;
}

export default function QuickActionsToolbar({
  selectedOrderCount,
  onBulkAction,
  onRefresh,
  onShowAnalytics,
  onShowExport,
  totalOrders,
}: QuickActionsToolbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const quickActions = [
    {
      id: 'confirm',
      label: 'Mark as Confirmed',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: 'bg-blue-600 hover:bg-blue-700',
      disabled: selectedOrderCount === 0,
    },
    {
      id: 'ship',
      label: 'Mark as Shipped',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      color: 'bg-purple-600 hover:bg-purple-700',
      disabled: selectedOrderCount === 0,
    },
    {
      id: 'delivered',
      label: 'Mark as Delivered',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-600 hover:bg-green-700',
      disabled: selectedOrderCount === 0,
    },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Left Section - Bulk Actions */}
        <div className="flex items-center space-x-3">
          {selectedOrderCount > 0 ? (
            <>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-[#895D35]">{selectedOrderCount}</span> order{selectedOrderCount > 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-2">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => onBulkAction(action.id)}
                    disabled={action.disabled}
                    className={`px-3 py-1.5 text-white text-sm rounded-md font-medium flex items-center space-x-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                    title={action.label}
                  >
                    {action.icon}
                    <span className="hidden sm:inline">{action.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">
              {totalOrders.toLocaleString()} orders total
            </div>
          )}
        </div>

        {/* Right Section - Tools */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            title="Refresh orders"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <div className="h-4 w-px bg-gray-300"></div>

          <button
            onClick={onShowAnalytics}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            title="View analytics"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          <button
            onClick={onShowExport}
            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
            title="Export orders"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          <div className="h-4 w-px bg-gray-300"></div>

          <div className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
