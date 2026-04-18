'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Product {
  productId: string;
  name: string;
  sku: string;
  category: string;
  activeVersionId: string | null;
  createdAt: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: '', description: '' });
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<{ data: Product[] }>('/api/products'),
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/products', form);
      setShowCreate(false);
      setForm({ name: '', sku: '', category: '', description: '' });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sản phẩm</h1>
        <Button onClick={() => setShowCreate(true)}>Thêm sản phẩm</Button>
      </div>

      <DataTable
        columns={[
          { key: 'sku', label: 'Mã SKU' },
          { key: 'name', label: 'Tên sản phẩm' },
          { key: 'category', label: 'Danh mục' },
          {
            key: 'activeVersionId',
            label: 'Phiên bản',
            render: (row: Product) =>
              row.activeVersionId ? (
                <Badge variant="success">Có BOM</Badge>
              ) : (
                <Badge variant="warning">Chưa có BOM</Badge>
              ),
          },
        ]}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="Chưa có sản phẩm nào"
        onRowClick={(row: Product) => router.push(`/master-data/products/${row.productId}`)}
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã SKU</label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Danh mục</label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
