'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useState } from 'react';

interface Item {
  itemId: string;
  name: string;
  sku: string;
  type: string;
  unit: string;
  reorderPoint: number | null;
}

const typeLabels: Record<string, string> = {
  raw_material: 'Nguyên liệu',
  component: 'Linh kiện',
  semi_finished: 'Bán thành phẩm',
  finished: 'Thành phẩm',
  consumable: 'Vật tư tiêu hao',
};

export default function ItemsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', type: 'raw_material', unit: 'pcs', reorderPoint: '' });
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['items'],
    queryFn: () => api.get<{ data: Item[] }>('/api/items'),
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/items', {
        ...form,
        reorderPoint: form.reorderPoint ? Number(form.reorderPoint) : null,
      });
      setShowCreate(false);
      setForm({ name: '', sku: '', type: 'raw_material', unit: 'pcs', reorderPoint: '' });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vật tư</h1>
        <Button onClick={() => setShowCreate(true)}>Thêm vật tư</Button>
      </div>

      <DataTable
        columns={[
          { key: 'sku', label: 'Mã SKU' },
          { key: 'name', label: 'Tên vật tư' },
          {
            key: 'type',
            label: 'Loại',
            render: (row: Item) => <Badge>{typeLabels[row.type] || row.type}</Badge>,
          },
          { key: 'unit', label: 'Đơn vị' },
          {
            key: 'reorderPoint',
            label: 'Điểm đặt hàng lại',
            render: (row: Item) => row.reorderPoint ?? '—',
          },
        ]}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="Chưa có vật tư nào"
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm vật tư mới</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã SKU</label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên vật tư</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại</label>
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={[
                  { value: 'raw_material', label: 'Nguyên liệu' },
                  { value: 'component', label: 'Linh kiện' },
                  { value: 'semi_finished', label: 'Bán thành phẩm' },
                  { value: 'finished', label: 'Thành phẩm' },
                  { value: 'consumable', label: 'Vật tư tiêu hao' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đơn vị</label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Điểm đặt hàng lại</label>
              <Input type="number" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })} />
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
