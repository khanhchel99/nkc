'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Supplier {
  supplierId: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  leadTimeDays: number | null;
}

export default function SuppliersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', email: '', phone: '', address: '', leadTimeDays: '' });
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.get<{ data: Supplier[] }>('/api/suppliers'),
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/suppliers', {
        name: form.name,
        code: form.code,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        leadTimeDays: form.leadTimeDays ? Number(form.leadTimeDays) : null,
      });
      setShowCreate(false);
      setForm({ name: '', code: '', email: '', phone: '', address: '', leadTimeDays: '' });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Nhà cung cấp</h1>
        <Button onClick={() => setShowCreate(true)}>Thêm nhà cung cấp</Button>
      </div>

      <DataTable
        columns={[
          { key: 'code', label: 'Mã NCC' },
          { key: 'name', label: 'Tên nhà cung cấp' },
          { key: 'email', label: 'Email', render: (row: Supplier) => row.email || '—' },
          { key: 'phone', label: 'Điện thoại', render: (row: Supplier) => row.phone || '—' },
          {
            key: 'leadTimeDays',
            label: 'Thời gian giao (ngày)',
            render: (row: Supplier) => row.leadTimeDays ?? '—',
          },
        ]}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="Chưa có nhà cung cấp nào"
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm nhà cung cấp mới</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã nhà cung cấp</label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên nhà cung cấp</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Điện thoại</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ</label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thời gian giao hàng (ngày)</label>
              <Input type="number" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Tạo mới'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
