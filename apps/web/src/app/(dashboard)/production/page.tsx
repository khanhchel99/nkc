'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface WorkOrder {
  workOrderId: string;
  woNumber: string;
  productName: string;
  quantity: number;
  status: string;
  currentStep: number | null;
  totalSteps: number;
  startDate: string | null;
  dueDate: string | null;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  created: { label: 'Đã tạo', variant: 'default' },
  released: { label: 'Đã phát hành', variant: 'default' },
  in_progress: { label: 'Đang sản xuất', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

export default function ProductionPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => api.get<{ data: WorkOrder[]; total: number }>('/api/production/work-orders'),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sản xuất - Lệnh sản xuất</h1>

      <DataTable
        columns={[
          { key: 'woNumber', label: 'Mã LSX' },
          { key: 'productName', label: 'Sản phẩm' },
          { key: 'quantity', label: 'Số lượng' },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row: WorkOrder) => {
              const s = statusMap[row.status] || { label: row.status, variant: 'default' as const };
              return <Badge variant={s.variant}>{s.label}</Badge>;
            },
          },
          {
            key: 'currentStep',
            label: 'Tiến độ',
            render: (row: WorkOrder) =>
              row.currentStep !== null
                ? `Bước ${row.currentStep}/${row.totalSteps}`
                : `0/${row.totalSteps}`,
          },
          {
            key: 'startDate',
            label: 'Ngày bắt đầu',
            render: (row: WorkOrder) =>
              row.startDate ? new Date(row.startDate).toLocaleDateString('vi-VN') : '—',
          },
          {
            key: 'dueDate',
            label: 'Hạn hoàn thành',
            render: (row: WorkOrder) =>
              row.dueDate ? new Date(row.dueDate).toLocaleDateString('vi-VN') : '—',
          },
        ]}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="Chưa có lệnh sản xuất nào"
        onRowClick={(row: WorkOrder) => router.push(`/production/${row.workOrderId}`)}
      />
    </div>
  );
}
