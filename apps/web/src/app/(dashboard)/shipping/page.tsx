'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────── */

interface Shipment {
  id: string;
  shipment_no: string;
  customer_id: string;
  etd: string | null;
  eta: string | null;
  priority: string;
  shipment_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  shipment_lines: ShipmentLine[];
  containers: Container[];
}

interface ShipmentLine {
  id: string;
  sales_order_line_id: string;
  ship_qty: number;
  status: string;
}

interface Container {
  id: string;
  container_no: string | null;
  container_type: string;
  max_cbm: number | null;
  max_weight_kg: number | null;
  status: string;
  container_allocations: ContainerAllocation[];
}

interface ContainerAllocation {
  id: string;
  packing_unit_id: string;
  allocation_seq: number;
  allocated_cbm: number | null;
  allocated_weight_kg: number | null;
}

interface PackingUnit {
  id: string;
  packing_unit_no: string;
  product_id: string;
  quantity: number;
  carton_no: string | null;
  cbm: number | null;
  gross_weight_kg: number | null;
  status: string;
}

/* ─── Status Maps ────────────────────────────────────────────── */

const shipmentStatusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Nháp', variant: 'default' },
  planned: { label: 'Đã lên kế hoạch', variant: 'default' },
  locked: { label: 'Đã khóa', variant: 'warning' },
  shipped: { label: 'Đã xuất', variant: 'success' },
  delivered: { label: 'Đã giao', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

const priorityMap: Record<string, { label: string; variant: 'default' | 'warning' | 'destructive' }> = {
  low: { label: 'Thấp', variant: 'default' },
  normal: { label: 'Bình thường', variant: 'default' },
  high: { label: 'Cao', variant: 'warning' },
  urgent: { label: 'Khẩn cấp', variant: 'destructive' },
};

const typeMap: Record<string, string> = {
  sea: 'Đường biển',
  air: 'Đường hàng không',
  land: 'Đường bộ',
};

const containerStatusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' }> = {
  open: { label: 'Đang mở', variant: 'default' },
  locked: { label: 'Đã khóa', variant: 'warning' },
  shipped: { label: 'Đã xuất', variant: 'success' },
};

/* ─── Page ───────────────────────────────────────────────────── */

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState<'shipments' | 'packing' | 'containers'>('shipments');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Giao hàng</h1>

      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shipments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('shipments')}
        >
          Đơn giao hàng
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'packing' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('packing')}
        >
          Đóng gói
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'containers' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('containers')}
        >
          Container
        </button>
      </div>

      {activeTab === 'shipments' && <ShipmentsTab />}
      {activeTab === 'packing' && <PackingTab />}
      {activeTab === 'containers' && <ContainersTab />}
    </div>
  );
}

/* ─── Shipments Tab ──────────────────────────────────────────── */

function ShipmentsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: () => api.get<{ data: Shipment[]; total: number }>('/api/shipping/shipments'),
  });

  return (
    <DataTable
      columns={[
        { key: 'shipment_no', label: 'Mã đơn giao' },
        {
          key: 'shipment_type',
          label: 'Loại',
          render: (row: Shipment) => typeMap[row.shipment_type] || row.shipment_type,
        },
        {
          key: 'priority',
          label: 'Ưu tiên',
          render: (row: Shipment) => {
            const p = priorityMap[row.priority] || { label: row.priority, variant: 'default' as const };
            return <Badge variant={p.variant}>{p.label}</Badge>;
          },
        },
        {
          key: 'status',
          label: 'Trạng thái',
          render: (row: Shipment) => {
            const s = shipmentStatusMap[row.status] || { label: row.status, variant: 'default' as const };
            return <Badge variant={s.variant}>{s.label}</Badge>;
          },
        },
        {
          key: 'etd',
          label: 'ETD',
          render: (row: Shipment) =>
            row.etd ? new Date(row.etd).toLocaleDateString('vi-VN') : '—',
        },
        {
          key: 'eta',
          label: 'ETA',
          render: (row: Shipment) =>
            row.eta ? new Date(row.eta).toLocaleDateString('vi-VN') : '—',
        },
        {
          key: 'shipment_lines',
          label: 'Dòng',
          render: (row: Shipment) => row.shipment_lines?.length || 0,
        },
        {
          key: 'containers',
          label: 'Container',
          render: (row: Shipment) => row.containers?.length || 0,
        },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có đơn giao hàng nào"
    />
  );
}

/* ─── Packing Units Tab ──────────────────────────────────────── */

function PackingTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['packing-units'],
    queryFn: () => api.get<{ data: PackingUnit[]; total: number }>('/api/shipping/packing-units'),
  });

  const puStatusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' }> = {
    packed: { label: 'Đã đóng gói', variant: 'default' },
    allocated: { label: 'Đã phân bổ', variant: 'warning' },
    shipped: { label: 'Đã xuất', variant: 'success' },
  };

  return (
    <DataTable
      columns={[
        { key: 'packing_unit_no', label: 'Mã đóng gói' },
        { key: 'carton_no', label: 'Thùng số', render: (row: PackingUnit) => row.carton_no || '—' },
        { key: 'quantity', label: 'Số lượng' },
        {
          key: 'cbm',
          label: 'CBM',
          render: (row: PackingUnit) => row.cbm ? Number(row.cbm).toFixed(4) : '—',
        },
        {
          key: 'gross_weight_kg',
          label: 'Trọng lượng (kg)',
          render: (row: PackingUnit) => row.gross_weight_kg ? Number(row.gross_weight_kg).toFixed(1) : '—',
        },
        {
          key: 'status',
          label: 'Trạng thái',
          render: (row: PackingUnit) => {
            const s = puStatusMap[row.status] || { label: row.status, variant: 'default' as const };
            return <Badge variant={s.variant}>{s.label}</Badge>;
          },
        },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có kiện hàng nào"
    />
  );
}

/* ─── Containers Tab ─────────────────────────────────────────── */

function ContainersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['containers'],
    queryFn: () => api.get<{ data: Container[]; total: number }>('/api/shipping/containers'),
  });

  return (
    <DataTable
      columns={[
        { key: 'container_no', label: 'Số container', render: (row: Container) => row.container_no || '—' },
        { key: 'container_type', label: 'Loại' },
        {
          key: 'max_cbm',
          label: 'CBM tối đa',
          render: (row: Container) => row.max_cbm ? Number(row.max_cbm).toFixed(1) : '—',
        },
        {
          key: 'max_weight_kg',
          label: 'Tải trọng (kg)',
          render: (row: Container) => row.max_weight_kg ? Number(row.max_weight_kg).toLocaleString('vi-VN') : '—',
        },
        {
          key: 'status',
          label: 'Trạng thái',
          render: (row: Container) => {
            const s = containerStatusMap[row.status] || { label: row.status, variant: 'default' as const };
            return <Badge variant={s.variant}>{s.label}</Badge>;
          },
        },
        {
          key: 'container_allocations',
          label: 'Kiện hàng',
          render: (row: Container) => row.container_allocations?.length || 0,
        },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có container nào"
    />
  );
}
