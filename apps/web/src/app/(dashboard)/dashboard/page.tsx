'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShoppingCart,
  Factory,
  ShieldCheck,
  Truck,
  Package,
  AlertTriangle,
} from 'lucide-react';

interface DashboardStats {
  activeOrders: number;
  inProduction: number;
  pendingQC: number;
  readyToShip: number;
  lowStockItems: number;
  openDefects: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const [orders, workOrders, inspections] = await Promise.allSettled([
          api.get<{ data: unknown[]; total: number }>('/api/sales-orders', { status: 'confirmed', limit: 1 }),
          api.get<{ data: unknown[]; total: number }>('/api/production/work-orders', { status: 'in_progress', limit: 1 }),
          api.get<{ data: unknown[]; total: number }>('/api/quality/inspections', { status: 'pending', limit: 1 }),
        ]);
        return {
          activeOrders: orders.status === 'fulfilled' ? orders.value.total : 0,
          inProduction: workOrders.status === 'fulfilled' ? workOrders.value.total : 0,
          pendingQC: inspections.status === 'fulfilled' ? inspections.value.total : 0,
          readyToShip: 0,
          lowStockItems: 0,
          openDefects: 0,
        };
      } catch {
        return { activeOrders: 0, inProduction: 0, pendingQC: 0, readyToShip: 0, lowStockItems: 0, openDefects: 0 };
      }
    },
    refetchInterval: 30000,
  });

  const cards = [
    { label: 'Đơn hàng đang xử lý', value: stats?.activeOrders, icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Đang sản xuất', value: stats?.inProduction, icon: Factory, color: 'text-orange-600' },
    { label: 'Chờ kiểm tra CL', value: stats?.pendingQC, icon: ShieldCheck, color: 'text-purple-600' },
    { label: 'Sẵn sàng giao hàng', value: stats?.readyToShip, icon: Truck, color: 'text-green-600' },
    { label: 'Vật tư tồn kho thấp', value: stats?.lowStockItems, icon: Package, color: 'text-yellow-600' },
    { label: 'Khiếm khuyết mở', value: stats?.openDefects, icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {isLoading ? '—' : (card.value ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
