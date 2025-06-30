"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useWholesaleAuth } from "../contexts/auth-context";
import {
  ChartBarIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";

export default function WholesaleDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logout, isLoading: authLoading } = useWholesaleAuth();
  const router = useRouter();

  // The auth context will handle redirecting to /auth/signin if not authenticated
  // No need for additional redirect logic here

  // Fetch dashboard data - using the correct method name from our router
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = api.wholesale.getDashboardData.useQuery(undefined, {
    enabled: !!user, // Only run query if user is authenticated
  });
  
  const { data: productsData, isLoading: productsLoading, error: productsError } = api.wholesale.getPrivateProducts.useQuery({
    page: 1,
    limit: 10,
  }, {
    enabled: !!user,
  });
  
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = api.wholesale.getOrders.useQuery({
    page: 1,
    limit: 10,
  }, {
    enabled: !!user,
  });

  const handleLogout = () => {
    logout(); // The auth context will handle redirect to /auth/signin
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (dashboardLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: ChartBarIcon },
    { id: "products", name: "Products", icon: CubeIcon },
    { id: "orders", name: "Orders", icon: ClockIcon },
    { id: "financials", name: "Financials", icon: CurrencyDollarIcon },
    { id: "communication", name: "Communication", icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wholesale Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {user.companyName}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Dashboard Overview */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {dashboardData?.stats?.totalOrders || 0}
                        </p>
                      </div>
                      <CubeIcon className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      +{dashboardData?.stats?.totalOrders || 0} from last month
                    </p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${Number(dashboardData?.stats?.totalValue || 0).toLocaleString()}
                        </p>
                      </div>
                      <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">+20.1% from last month</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${Number(dashboardData?.stats?.totalOrders > 0 ? dashboardData?.stats?.totalValue / dashboardData?.stats?.totalOrders : 0).toFixed(2)}
                        </p>
                      </div>
                      <ChartBarIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">+7% from last month</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${Number(dashboardData?.financialData?.totalOutstanding || 0).toLocaleString()}
                        </p>
                      </div>
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Financial overview available
                    </p>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                    <p className="text-sm text-gray-500">Your latest order activity</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {dashboardData?.recentOrders?.map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <CubeIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">${Number(order.totalAmount).toLocaleString()}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === "pending" 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-green-100 text-green-800"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!dashboardData?.recentOrders || dashboardData.recentOrders.length === 0) && (
                        <p className="text-gray-500 text-center py-8">No orders yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Private Product Catalog</h3>
                    <p className="text-sm text-gray-500">Products available for your company</p>
                  </div>
                  <div className="p-6">
                    {productsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productsData?.products?.map((product: any) => (
                          <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                              {product.images.length > 0 ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <CubeIcon className="h-12 w-12 text-gray-400" />
                              )}
                            </div>
                            <div className="p-4">
                              <h4 className="font-medium text-lg text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{product.sku}</p>
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description}</p>
                              <div className="flex justify-between items-center mt-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {product.category}
                                </span>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                                  Add to Quote
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {!productsLoading && (!productsData?.products || productsData.products.length === 0) && (
                          <div className="col-span-3 text-center py-8">
                            <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No products available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Order History</h3>
                    <p className="text-sm text-gray-500">Track your order status and history</p>
                  </div>
                  <div className="p-6">
                    {ordersLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {ordersData?.orders?.map((order: any) => (
                          <div 
                            key={order.id} 
                            className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                            onClick={() => router.push(`/wholesale/orders/${order.id}`)}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-medium text-lg text-gray-900">{order.orderNumber}</h4>
                                <p className="text-sm text-gray-500">
                                  Ordered on {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-lg text-gray-900">${Number(order.totalAmount).toLocaleString()}</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === "pending" 
                                    ? "bg-yellow-100 text-yellow-800" 
                                    : "bg-green-100 text-green-800"
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Priority</p>
                                <p className="font-medium capitalize text-gray-900">{order.priority}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Estimated Delivery</p>
                                <p className="font-medium text-gray-900">
                                  {order.estimatedDelivery 
                                    ? new Date(order.estimatedDelivery).toLocaleDateString()
                                    : "TBD"
                                  }
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Items</p>
                                <p className="font-medium text-gray-900">{order.items?.length || 0} items</p>
                              </div>
                            </div>
                            
                            {order.notes && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">{order.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {!ordersLoading && (!ordersData?.orders || ordersData.orders.length === 0) && (
                          <div className="text-center py-8">
                            <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No orders found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Financials Tab */}
            {activeTab === "financials" && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Financial Overview</h3>
                    <p className="text-sm text-gray-500">Your account balance and payment history</p>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-8">
                      <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Financial data will be available soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Communication Tab */}
            {activeTab === "communication" && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Communication Center</h3>
                    <p className="text-sm text-gray-500">Send messages and product requests</p>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-8">
                      <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Communication features coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
