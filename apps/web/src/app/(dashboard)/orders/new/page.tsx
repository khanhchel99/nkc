'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface OrderLine {
  productId: string;
  quantity: string;
  unit: string;
  notes: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    requestedDate: '',
    notes: '',
  });
  const [lines, setLines] = useState<OrderLine[]>([
    { productId: '', quantity: '1', unit: 'pcs', notes: '' },
  ]);

  function addLine() {
    setLines([...lines, { productId: '', quantity: '1', unit: 'pcs', notes: '' }]);
  }

  function removeLine(i: number) {
    setLines(lines.filter((_, idx) => idx !== i));
  }

  function updateLine(i: number, field: keyof OrderLine, value: string) {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    setLines(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const result = await api.post<{ orderId: string }>('/api/sales-orders', {
        customerId: form.customerId,
        orderDate: form.orderDate,
        requestedDate: form.requestedDate,
        notes: form.notes || null,
        lines: lines.map((l, i) => ({
          lineNumber: i + 1,
          productId: l.productId,
          quantity: Number(l.quantity),
          unit: l.unit,
          notes: l.notes || null,
        })),
      });
      router.push(`/orders/${result.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo đơn hàng thất bại');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Tạo đơn hàng mới</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">{error}</div>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin chung</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã khách hàng</label>
              <Input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày đặt hàng</label>
              <Input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày yêu cầu giao</label>
              <Input type="date" value={form.requestedDate} onChange={(e) => setForm({ ...form, requestedDate: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Dòng đơn hàng</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addLine}>
              <Plus className="h-4 w-4 mr-1" /> Thêm dòng
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lines.map((line, i) => (
              <div key={i} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Mã sản phẩm</label>
                  <Input value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)} required />
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium mb-1">Số lượng</label>
                  <Input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} required />
                </div>
                <div className="w-20">
                  <label className="block text-sm font-medium mb-1">Đơn vị</label>
                  <Input value={line.unit} onChange={(e) => updateLine(i, 'unit', e.target.value)} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLine(i)}
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Tạo đơn hàng'}</Button>
        </div>
      </form>
    </div>
  );
}
