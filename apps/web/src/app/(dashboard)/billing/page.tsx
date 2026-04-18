'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────── */

interface Invoice {
  id: string;
  invoice_no: string;
  customer_id: string;
  invoice_date: string;
  due_date: string | null;
  currency_code: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  invoice_lines: InvoiceLine[];
}

interface InvoiceLine {
  id: string;
  line_no: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_amount: number;
}

/* ─── Status Maps ────────────────────────────────────────────── */

const invoiceStatusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Nháp', variant: 'default' },
  issued: { label: 'Đã phát hành', variant: 'warning' },
  partially_paid: { label: 'Thanh toán một phần', variant: 'warning' },
  paid: { label: 'Đã thanh toán', variant: 'success' },
  void: { label: 'Đã hủy', variant: 'destructive' },
};

/* ─── Page ───────────────────────────────────────────────────── */

export default function BillingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Hóa đơn & Thanh toán</h1>

      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('invoices')}
        >
          Hóa đơn
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('payments')}
        >
          Thanh toán
        </button>
      </div>

      {activeTab === 'invoices' && <InvoicesTab router={router} />}
      {activeTab === 'payments' && <PaymentsTab />}
    </div>
  );
}

/* ─── Invoices Tab ───────────────────────────────────────────── */

function InvoicesTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get<{ data: Invoice[]; total: number }>('/api/billing/invoices'),
  });

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);

  return (
    <DataTable
      columns={[
        { key: 'invoice_no', label: 'Mã hóa đơn' },
        {
          key: 'invoice_date',
          label: 'Ngày hóa đơn',
          render: (row: Invoice) => new Date(row.invoice_date).toLocaleDateString('vi-VN'),
        },
        {
          key: 'due_date',
          label: 'Hạn thanh toán',
          render: (row: Invoice) =>
            row.due_date ? new Date(row.due_date).toLocaleDateString('vi-VN') : '—',
        },
        {
          key: 'total_amount',
          label: 'Tổng tiền',
          render: (row: Invoice) => formatCurrency(Number(row.total_amount), row.currency_code),
        },
        {
          key: 'paid_amount',
          label: 'Đã thanh toán',
          render: (row: Invoice) => formatCurrency(Number(row.paid_amount), row.currency_code),
        },
        {
          key: 'remaining',
          label: 'Còn lại',
          render: (row: Invoice) =>
            formatCurrency(Number(row.total_amount) - Number(row.paid_amount), row.currency_code),
        },
        {
          key: 'status',
          label: 'Trạng thái',
          render: (row: Invoice) => {
            const s = invoiceStatusMap[row.status] || { label: row.status, variant: 'default' as const };
            return <Badge variant={s.variant}>{s.label}</Badge>;
          },
        },
        {
          key: 'invoice_lines',
          label: 'Dòng',
          render: (row: Invoice) => row.invoice_lines?.length || 0,
        },
      ]}
      data={data?.data || []}
      isLoading={isLoading}
      emptyMessage="Chưa có hóa đơn nào"
      onRowClick={(row: Invoice) => router.push(`/billing/${row.id}`)}
    />
  );
}

/* ─── Payments Tab ───────────────────────────────────────────── */

function PaymentsTab() {
  // Aggregate all payments from all invoices
  const { data, isLoading } = useQuery({
    queryKey: ['invoices-with-payments'],
    queryFn: async () => {
      const result = await api.get<{ data: Invoice[] }>('/api/billing/invoices', { limit: '100' });
      return result.data;
    },
  });

  // Build a lookup map for invoices
  const invoiceMap = new Map<string, Invoice>();
  if (data) {
    for (const inv of data) {
      invoiceMap.set(inv.id, inv);
    }
  }

  return (
    <div>
      <DataTable
        columns={[
          { key: 'invoice_no', label: 'Mã hóa đơn' },
          {
            key: 'total_amount',
            label: 'Tổng tiền',
            render: (row: Invoice) =>
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: row.currency_code }).format(Number(row.total_amount)),
          },
          {
            key: 'paid_amount',
            label: 'Đã thanh toán',
            render: (row: Invoice) =>
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: row.currency_code }).format(Number(row.paid_amount)),
          },
          {
            key: 'status',
            label: 'Trạng thái',
            render: (row: Invoice) => {
              const s = invoiceStatusMap[row.status] || { label: row.status, variant: 'default' as const };
              return <Badge variant={s.variant}>{s.label}</Badge>;
            },
          },
        ]}
        data={data || []}
        isLoading={isLoading}
        emptyMessage="Chưa có thanh toán nào"
      />
    </div>
  );
}
