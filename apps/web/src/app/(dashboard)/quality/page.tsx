'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Inspection {
  inspectionId: string;
  inspectionNumber: string;
  workOrderNumber: string;
  status: string;
  inspectorName: string | null;
  createdAt: string;
  result: string | null;
}

interface Defect {
  defectId: string;
  inspectionNumber: string;
  defectType: string;
  severity: string;
  description: string;
  disposition: string | null;
  createdAt: string;
}

const inspectionStatusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  pending: { label: 'Chờ kiểm tra', variant: 'warning' },
  in_progress: { label: 'Đang kiểm tra', variant: 'default' },
  passed: { label: 'Đạt', variant: 'success' },
  failed: { label: 'Không đạt', variant: 'destructive' },
  conditional: { label: 'Đạt có điều kiện', variant: 'warning' },
};

const severityMap: Record<string, { label: string; variant: 'default' | 'warning' | 'destructive' }> = {
  minor: { label: 'Nhẹ', variant: 'default' },
  major: { label: 'Nghiêm trọng', variant: 'warning' },
  critical: { label: 'Nguy hiểm', variant: 'destructive' },
};

const dispositionMap: Record<string, string> = {
  rework: 'Sửa lại',
  scrap: 'Phế phẩm',
  accept_as_is: 'Chấp nhận nguyên trạng',
  return_to_supplier: 'Trả nhà cung cấp',
};

export default function QualityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inspections' | 'defects'>('inspections');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Chất lượng</h1>

      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inspections' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('inspections')}
        >
          Kiểm tra chất lượng
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'defects' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('defects')}
        >
          Khiếm khuyết
        </button>
      </div>

      {activeTab === 'inspections' && <InspectionsTab router={router} />}
      {activeTab === 'defects' && <DefectsTab />}
    </div>
  );
}

function InspectionsTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const { data, isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => api.get<{ data: Inspection[] }>('/api/quality/inspections'),
  });

  return (
    <DataTable
      columns={[
        { key: 'inspectionNumber', label: 'Mã kiểm tra' },
        { key: 'workOrderNumber', label: 'Lệnh SX' },
        {
          key: 'status',
          label: 'Trạng thái',
          render: (row: Inspection) => {
            const s = inspectionStatusMap[row.status] || { label: row.status, variant: 'default' as const };
            return <Badge variant={s.variant}>{s.label}</Badge>;
          },
        },
        { key: 'inspectorName', label: 'Người kiểm tra', render: (row: Inspection) => row.inspectorName || '—' },
        { key: 'result', label: 'Kết quả', render: (row: Inspection) => row.result || '—' },
        { key: 'createdAt', label: 'Ngày tạo', render: (row: Inspection) => new Date(row.createdAt).toLocaleDateString('vi-VN') },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có phiếu kiểm tra nào"
      onRowClick={(row: Inspection) => router.push(`/quality/${row.inspectionId}`)}
    />
  );
}

function DefectsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['defects'],
    queryFn: () => api.get<{ data: Defect[] }>('/api/quality/defects'),
  });

  return (
    <DataTable
      columns={[
        { key: 'inspectionNumber', label: 'Mã kiểm tra' },
        { key: 'defectType', label: 'Loại khiếm khuyết' },
        {
          key: 'severity',
          label: 'Mức độ',
          render: (row: Defect) => {
            const s = severityMap[row.severity] || { label: row.severity, variant: 'default' as const };
            return <Badge variant={s.variant}>{s.label}</Badge>;
          },
        },
        { key: 'description', label: 'Mô tả' },
        {
          key: 'disposition',
          label: 'Xử lý',
          render: (row: Defect) => row.disposition ? dispositionMap[row.disposition] || row.disposition : '—',
        },
        { key: 'createdAt', label: 'Ngày', render: (row: Defect) => new Date(row.createdAt).toLocaleDateString('vi-VN') },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có khiếm khuyết nào"
    />
  );
}
