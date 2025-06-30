"use client";
import { useState } from "react";
import { api } from "@/trpc/react";

type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

interface AdvancedAnalyticsProps {
  onClose: () => void;
}

export default function AdvancedAnalytics({ onClose }: AdvancedAnalyticsProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');
  
  const { data: analytics, isLoading } = api.orderManagement.getAdvancedAnalytics.useQuery({
    period,
    includeComparison: true,
  });

  const periodLabels = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    '1y': 'Last Year',
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#895D35]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
            <p className="text-gray-600">Detailed insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#895D35]"
            >
              {Object.entries(periodLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {analytics && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(analytics.currentPeriod.revenue)}
                    </p>
                    {analytics.comparison && (
                      <p className={`text-sm ${getChangeColor(analytics.comparison.revenue.change)}`}>
                        {formatPercentage(analytics.comparison.revenue.change)} vs previous period
                      </p>
                    )}
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Total Orders</p>
                    <p className="text-2xl font-bold text-green-900">
                      {analytics.currentPeriod.orderCount}
                    </p>
                    {analytics.comparison && (
                      <p className={`text-sm ${getChangeColor(analytics.comparison.orderCount.change)}`}>
                        {formatPercentage(analytics.comparison.orderCount.change)} vs previous period
                      </p>
                    )}
                  </div>
                  <div className="text-green-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatCurrency(analytics.currentPeriod.avgOrderValue)}
                    </p>
                    {analytics.comparison && (
                      <p className={`text-sm ${getChangeColor(analytics.comparison.avgOrderValue.change)}`}>
                        {formatPercentage(analytics.comparison.avgOrderValue.change)} vs previous period
                      </p>
                    )}
                  </div>
                  <div className="text-purple-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analytics.currentPeriod.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600 capitalize">{status}</div>
                    <div className="text-xs text-gray-500">
                      {analytics.currentPeriod.orderCount > 0 
                        ? `${((count / analytics.currentPeriod.orderCount) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
              <div className="space-y-3">
                {analytics.currentPeriod.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-[#895D35] text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-gray-900 font-medium">{product.name}</span>
                    </div>
                    <div className="text-gray-600">
                      {product.quantity} sold
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Trend */}
            {analytics.currentPeriod.revenueTrend.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics.currentPeriod.revenueTrend.slice(-7).map((day) => (
                    <div key={day.date} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(day.revenue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
