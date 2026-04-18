'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';

interface SalesOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: string;
  orderDate: string;
  requestedDate: string;
  totalLines: number;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Nháp', variant: 'default' },
  confirmed: { label: 'Đã xác nhận', variant: 'success' },
  in_production: { label: 'Đang sản xuất', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

export default function OrdersPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: () => api.get<{ data: SalesOrder[]; total: number }>('/api/sales-orders'),
  });

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await fetch('/api/order-import/upload', { method: 'POST', body: formData });
      refetch();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Đơn hàng</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Đang tải...' : 'Nhập từ Excel'}
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          <Button onClick={() => router.push('/orders/new')}>Tạo đơn hàng</Button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'orderNumber', label: 'Mã đơn hàng' },
          { key: 'customerName', label: 'Khách hàng' },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row: SalesOrder) => {
              const s = statusMap[row.status] || { label: row.status, variant: 'default' as const };
              return <Badge variant={s.variant}>{s.label}</Badge>;
            },
          },
          { key: 'orderDate', label: 'Ngày đặt', render: (row: SalesOrder) => new Date(row.orderDate).toLocaleDateString('vi-VN') },
          { key: 'requestedDate', label: 'Ngày yêu cầu', render: (row: SalesOrder) => new Date(row.requestedDate).toLocaleDateString('vi-VN') },
          { key: 'totalLines', label: 'Số dòng' },
        ]}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="Chưa có đơn hàng nào"
        onRowClick={(row: SalesOrder) => router.push(`/orders/${row.orderId}`)}
      />
    </div>
  );
}
