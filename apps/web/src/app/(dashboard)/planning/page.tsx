'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MrpResult {
  shortages: { itemId: string; itemName: string; required: number; available: number; shortage: number; unit: string }[];
}

interface ProductionPlan {
  planId: string;
  planNumber: string;
  status: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
}

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState<'mrp' | 'plans'>('plans');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kế hoạch sản xuất</h1>

      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'plans' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('plans')}
        >
          Kế hoạch sản xuất
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'mrp' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('mrp')}
        >
          MRP - Tính nhu cầu vật tư
        </button>
      </div>

      {activeTab === 'plans' && <ProductionPlansTab />}
      {activeTab === 'mrp' && <MrpTab />}
    </div>
  );
}

function ProductionPlansTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['production-plans'],
    queryFn: () => api.get<{ data: ProductionPlan[] }>('/api/planning/production-plans'),
  });

  const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' }> = {
    draft: { label: 'Nháp', variant: 'default' },
    confirmed: { label: 'Đã xác nhận', variant: 'success' },
    in_progress: { label: 'Đang thực hiện', variant: 'warning' },
    completed: { label: 'Hoàn thành', variant: 'success' },
  };

  return (
    <DataTable
      columns={[
        { key: 'planNumber', label: 'Mã kế hoạch' },
        {
          key: 'status',
          label: 'Trạng thái',
          render: (row: ProductionPlan) => {
            const s = statusMap[row.status] || { label: row.status, variant: 'default' as const };
            return <Badge variant={s.variant}>{s.label}</Badge>;
          },
        },
        { key: 'startDate', label: 'Ngày bắt đầu', render: (row: ProductionPlan) => new Date(row.startDate).toLocaleDateString('vi-VN') },
        { key: 'endDate', label: 'Ngày kết thúc', render: (row: ProductionPlan) => new Date(row.endDate).toLocaleDateString('vi-VN') },
        { key: 'totalOrders', label: 'Số đơn hàng' },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có kế hoạch sản xuất nào"
    />
  );
}

function MrpTab() {
  const [orderId, setOrderId] = useState('');
  const mrpMutation = useMutation({
    mutationFn: (orderIds: string[]) =>
      api.post<MrpResult>('/api/planning/mrp', { orderIds }),
  });

  function runMrp() {
    if (!orderId.trim()) return;
    mrpMutation.mutate(orderId.split(',').map((s) => s.trim()));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Chạy MRP</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <input
              className="flex-1 border rounded-md px-3 py-2 text-sm"
              placeholder="Nhập mã đơn hàng (phân tách bằng dấu phẩy)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <Button onClick={runMrp} disabled={mrpMutation.isPending}>
              {mrpMutation.isPending ? 'Đang tính...' : 'Chạy MRP'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {mrpMutation.data && (
        <Card>
          <CardHeader><CardTitle className="text-base">Kết quả - Thiếu hụt vật tư</CardTitle></CardHeader>
          <CardContent>
            {mrpMutation.data.shortages.length === 0 ? (
              <p className="text-sm text-green-600 font-medium">Đủ vật tư cho tất cả đơn hàng!</p>
            ) : (
              <DataTable
                columns={[
                  { key: 'itemName', label: 'Tên vật tư' },
                  { key: 'required', label: 'Cần' },
                  { key: 'available', label: 'Có sẵn' },
                  {
                    key: 'shortage',
                    label: 'Thiếu',
                    render: (row: MrpResult['shortages'][0]) => (
                      <span className="text-red-600 font-semibold">{row.shortage}</span>
                    ),
                  },
                  { key: 'unit', label: 'Đơn vị' },
                ]}
                data={mrpMutation.data.shortages}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
