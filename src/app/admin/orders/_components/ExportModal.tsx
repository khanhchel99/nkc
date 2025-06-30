"use client";
import { useState } from "react";
import { api } from "@/trpc/react";

interface ExportModalProps {
  onClose: () => void;
  currentFilters: any;
}

export default function ExportModal({ onClose, currentFilters }: ExportModalProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [useCurrentFilters, setUseCurrentFilters] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const formatExportData = (exportData: any) => {
    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }
    
    // CSV format
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Status',
      'Total',
      'Item Count',
      'Created At',
      'Updated At',
      'Items'
    ];
    
    const csvRows = [headers.join(',')];
    
    exportData.data.forEach((order: any) => {
      const itemsStr = order.items.map((item: any) => 
        `${item.productName} (${item.quantity}x$${item.price})`
      ).join('; ');
      
      const row = [
        order.id,
        `"${order.customerName}"`,
        order.customerEmail,
        order.customerPhone,
        order.status,
        order.total,
        order.itemCount,
        order.createdAt,
        order.updatedAt,
        `"${itemsStr}"`
      ];
      
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const filters = useCurrentFilters ? {
        search: currentFilters.search || undefined,
        status: currentFilters.status || undefined,
        userId: currentFilters.userId || undefined,
        minTotal: currentFilters.minTotal || undefined,
        maxTotal: currentFilters.maxTotal || undefined,
        startDate: currentFilters.startDate ? new Date(currentFilters.startDate) : undefined,
        endDate: currentFilters.endDate ? new Date(currentFilters.endDate) : undefined,
      } : undefined;

      // Use fetch directly for now - we'll implement a simpler solution
      const response = await fetch('/api/export-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          filters,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const data = await response.json();

      // Create and download file
      const blob = new Blob([formatExportData(data)], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Export Orders</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as 'csv')}
                  className="h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">
                  CSV (Excel compatible)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as 'json')}
                  className="h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">
                  JSON (with detailed structure)
                </span>
              </label>
            </div>
          </div>

          {/* Filter Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Data Selection
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useCurrentFilters}
                  onChange={(e) => setUseCurrentFilters(e.target.checked)}
                  className="h-4 w-4 text-[#895D35] focus:ring-[#895D35] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">
                  Use current filters
                </span>
              </label>
              {useCurrentFilters && (
                <div className="ml-6 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <p>Current filters applied:</p>
                  <ul className="mt-1 space-y-1">
                    {currentFilters.search && <li>• Search: "{currentFilters.search}"</li>}
                    {currentFilters.status && <li>• Status: {currentFilters.status}</li>}
                    {currentFilters.minTotal && <li>• Min Total: ${currentFilters.minTotal}</li>}
                    {currentFilters.maxTotal && <li>• Max Total: ${currentFilters.maxTotal}</li>}
                    {currentFilters.startDate && <li>• Start Date: {new Date(currentFilters.startDate).toLocaleDateString()}</li>}
                    {currentFilters.endDate && <li>• End Date: {new Date(currentFilters.endDate).toLocaleDateString()}</li>}
                    {!currentFilters.search && !currentFilters.status && !currentFilters.minTotal && !currentFilters.maxTotal && !currentFilters.startDate && !currentFilters.endDate && (
                      <li>• No filters applied (all orders)</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 px-4 py-2 bg-[#895D35] text-white rounded-lg hover:bg-[#7A4F2A] font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
