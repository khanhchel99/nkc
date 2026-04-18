'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

interface StockBalance {
  itemId: string;
  itemName: string;
  warehouseName: string;
  binCode: string;
  lotNumber: string | null;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  unit: string;
}

interface InventoryTransaction {
  transactionId: string;
  itemName: string;
  type: string;
  quantity: number;
  unit: string;
  warehouseName: string;
  createdAt: string;
  reference: string | null;
}

const txTypeMap: Record<string, string> = {
  receipt: 'Nhập kho',
  issue: 'Xuất kho',
  transfer: 'Chuyển kho',
  adjustment: 'Điều chỉnh',
  production_issue: 'Xuất sản xuất',
  production_receipt: 'Nhập sản xuất',
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'balances' | 'transactions'>('balances');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kho hàng</h1>

      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'balances' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('balances')}
        >
          Tồn kho
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('transactions')}
        >
          Giao dịch kho
        </button>
      </div>

      {activeTab === 'balances' && <BalancesTab />}
      {activeTab === 'transactions' && <TransactionsTab />}
    </div>
  );
}

function BalancesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-balances'],
    queryFn: () => api.get<{ data: StockBalance[] }>('/api/inventory/balances'),
  });

  return (
    <DataTable
      columns={[
        { key: 'itemName', label: 'Vật tư' },
        { key: 'warehouseName', label: 'Kho' },
        { key: 'binCode', label: 'Vị trí' },
        { key: 'lotNumber', label: 'Số lô', render: (row: StockBalance) => row.lotNumber || '—' },
        { key: 'quantityOnHand', label: 'Tồn kho' },
        { key: 'quantityReserved', label: 'Đã đặt trước' },
        {
          key: 'quantityAvailable',
          label: 'Khả dụng',
          render: (row: StockBalance) => (
            <span className={row.quantityAvailable <= 0 ? 'text-red-600 font-semibold' : ''}>
              {row.quantityAvailable}
            </span>
          ),
        },
        { key: 'unit', label: 'Đơn vị' },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có dữ liệu tồn kho"
    />
  );
}

function TransactionsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: () => api.get<{ data: InventoryTransaction[] }>('/api/inventory/transactions'),
  });

  return (
    <DataTable
      columns={[
        { key: 'createdAt', label: 'Ngày', render: (row: InventoryTransaction) => new Date(row.createdAt).toLocaleDateString('vi-VN') },
        { key: 'itemName', label: 'Vật tư' },
        {
          key: 'type',
          label: 'Loại',
          render: (row: InventoryTransaction) => (
            <Badge variant={row.type.includes('receipt') ? 'success' : row.type.includes('issue') ? 'warning' : 'default'}>
              {txTypeMap[row.type] || row.type}
            </Badge>
          ),
        },
        { key: 'quantity', label: 'Số lượng' },
        { key: 'unit', label: 'Đơn vị' },
        { key: 'warehouseName', label: 'Kho' },
        { key: 'reference', label: 'Tham chiếu', render: (row: InventoryTransaction) => row.reference || '—' },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có giao dịch kho"
    />
  );
}
