'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface ProductDetail {
  productId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  activeVersion: {
    versionId: string;
    versionNumber: number;
    bomLines: { itemId: string; itemName: string; quantity: number; unit: string }[];
    routingSteps: { stepOrder: number; workCenterName: string; operationName: string; cycleTimeMins: number }[];
  } | null;
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [showBomDialog, setShowBomDialog] = useState(false);
  const [bomForm, setBomForm] = useState({ itemId: '', quantity: '', unit: 'pcs' });
  const [saving, setSaving] = useState(false);

  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get<ProductDetail>(`/api/products/${productId}`),
    enabled: !!productId,
  });

  async function handleAddBomLine(e: React.FormEvent) {
    e.preventDefault();
    if (!product?.activeVersion) return;
    setSaving(true);
    try {
      await api.post(`/api/products/${productId}/versions/${product.activeVersion.versionId}/bom`, {
        itemId: bomForm.itemId,
        quantity: Number(bomForm.quantity),
        unit: bomForm.unit,
      });
      setShowBomDialog(false);
      setBomForm({ itemId: '', quantity: '', unit: 'pcs' });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (!product) return <div className="text-muted-foreground">Không tìm thấy sản phẩm</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">SKU: {product.sku} — {product.category}</p>
        </div>
      </div>

      {product.description && (
        <Card>
          <CardHeader><CardTitle className="text-base">Mô tả</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{product.description}</p></CardContent>
        </Card>
      )}

      {/* BOM */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Định mức vật tư (BOM)</CardTitle>
          {product.activeVersion && (
            <div className="flex items-center gap-2">
              <Badge>Phiên bản {product.activeVersion.versionNumber}</Badge>
              <Button size="sm" onClick={() => setShowBomDialog(true)}>Thêm vật tư</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {product.activeVersion?.bomLines ? (
            <DataTable
              columns={[
                { key: 'itemName', label: 'Tên vật tư' },
                { key: 'quantity', label: 'Số lượng' },
                { key: 'unit', label: 'Đơn vị' },
              ]}
              data={product.activeVersion.bomLines}
              emptyMessage="Chưa có dòng BOM"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có phiên bản BOM nào được tạo.</p>
          )}
        </CardContent>
      </Card>

      {/* Routing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quy trình sản xuất (Routing)</CardTitle>
        </CardHeader>
        <CardContent>
          {product.activeVersion?.routingSteps ? (
            <DataTable
              columns={[
                { key: 'stepOrder', label: 'Bước' },
                { key: 'workCenterName', label: 'Trung tâm gia công' },
                { key: 'operationName', label: 'Công đoạn' },
                { key: 'cycleTimeMins', label: 'Thời gian (phút)' },
              ]}
              data={product.activeVersion.routingSteps}
              emptyMessage="Chưa có bước quy trình"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có quy trình sản xuất.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBomDialog} onOpenChange={setShowBomDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm vật tư vào BOM</DialogTitle></DialogHeader>
          <form onSubmit={handleAddBomLine} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã vật tư (Item ID)</label>
              <Input value={bomForm.itemId} onChange={(e) => setBomForm({ ...bomForm, itemId: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số lượng</label>
              <Input type="number" step="0.01" value={bomForm.quantity} onChange={(e) => setBomForm({ ...bomForm, quantity: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đơn vị</label>
              <Input value={bomForm.unit} onChange={(e) => setBomForm({ ...bomForm, unit: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBomDialog(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Thêm'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
