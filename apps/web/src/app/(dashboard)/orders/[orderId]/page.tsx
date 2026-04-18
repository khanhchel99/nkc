'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';

interface OrderDetail {
  orderId: string;
  orderNumber: string;
  customerName: string;
  status: string;
  orderDate: string;
  requestedDate: string;
  notes: string | null;
  lines: {
    lineId: string;
    lineNumber: number;
    productName: string;
    sku: string;
    quantity: number;
    unit: string;
  }[];
}

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Nháp', variant: 'default' },
  confirmed: { label: 'Đã xác nhận', variant: 'success' },
  in_production: { label: 'Đang sản xuất', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.get<OrderDetail>(`/api/sales-orders/${orderId}`),
    enabled: !!orderId,
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/api/sales-orders/${orderId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (!order) return <div className="text-muted-foreground">Không tìm thấy đơn hàng</div>;

  const status = statusMap[order.status] || { label: order.status, variant: 'default' as const };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng {order.orderNumber}</h1>
          <p className="text-muted-foreground">Khách hàng: {order.customerName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={status.variant}>{status.label}</Badge>
          {order.status === 'draft' && (
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đơn hàng'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ngày đặt</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ngày yêu cầu</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{new Date(order.requestedDate).toLocaleDateString('vi-VN')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Số dòng</CardTitle></CardHeader>
          <CardContent><p className="font-semibold">{order.lines.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Trạng thái</CardTitle></CardHeader>
          <CardContent><Badge variant={status.variant}>{status.label}</Badge></CardContent>
        </Card>
      </div>

      {order.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Ghi chú</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{order.notes}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Chi tiết đơn hàng</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'lineNumber', label: 'STT' },
              { key: 'sku', label: 'Mã SKU' },
              { key: 'productName', label: 'Tên sản phẩm' },
              { key: 'quantity', label: 'Số lượng' },
              { key: 'unit', label: 'Đơn vị' },
            ]}
            data={order.lines}
            emptyMessage="Không có dòng nào"
          />
        </CardContent>
      </Card>
    </div>
  );
}
