'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';

interface WorkOrderDetail {
  workOrderId: string;
  woNumber: string;
  productName: string;
  quantity: number;
  status: string;
  currentStep: number | null;
  steps: {
    stepId: string;
    stepOrder: number;
    operationName: string;
    workCenterName: string;
    status: string;
    cycleTimeMins: number;
  }[];
  executionLogs: {
    logId: string;
    stepOrder: number;
    operatorName: string;
    quantityProduced: number;
    startTime: string;
    endTime: string | null;
  }[];
  scrapLogs: {
    logId: string;
    stepOrder: number;
    quantity: number;
    reason: string;
  }[];
}

const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  created: { label: 'Đã tạo', variant: 'default' },
  released: { label: 'Đã phát hành', variant: 'default' },
  in_progress: { label: 'Đang sản xuất', variant: 'warning' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  cancelled: { label: 'Đã hủy', variant: 'destructive' },
  pending: { label: 'Chờ', variant: 'default' },
  done: { label: 'Xong', variant: 'success' },
};

export default function WorkOrderDetailPage() {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const queryClient = useQueryClient();
  const [showExecDialog, setShowExecDialog] = useState(false);
  const [showScrapDialog, setShowScrapDialog] = useState(false);
  const [execForm, setExecForm] = useState({ operatorName: '', quantityProduced: '' });
  const [scrapForm, setScrapForm] = useState({ quantity: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const { data: wo, isLoading } = useQuery({
    queryKey: ['work-order', workOrderId],
    queryFn: () => api.get<WorkOrderDetail>(`/api/production/work-orders/${workOrderId}`),
    enabled: !!workOrderId,
  });

  const advanceMutation = useMutation({
    mutationFn: () => api.post(`/api/production/work-orders/${workOrderId}/advance-step`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work-order', workOrderId] }),
  });

  async function handleLogExecution(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/production/work-orders/${workOrderId}/execution-logs`, {
        operatorName: execForm.operatorName,
        quantityProduced: Number(execForm.quantityProduced),
        startTime: new Date().toISOString(),
      });
      setShowExecDialog(false);
      setExecForm({ operatorName: '', quantityProduced: '' });
      queryClient.invalidateQueries({ queryKey: ['work-order', workOrderId] });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogScrap(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/production/work-orders/${workOrderId}/scrap-logs`, {
        quantity: Number(scrapForm.quantity),
        reason: scrapForm.reason,
      });
      setShowScrapDialog(false);
      setScrapForm({ quantity: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['work-order', workOrderId] });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (!wo) return <div className="text-muted-foreground">Không tìm thấy lệnh sản xuất</div>;

  const currentStatus = statusMap[wo.status] || { label: wo.status, variant: 'default' as const };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lệnh sản xuất {wo.woNumber}</h1>
          <p className="text-muted-foreground">{wo.productName} — SL: {wo.quantity}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
          {wo.status === 'in_progress' && (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowExecDialog(true)}>
                Ghi nhận sản lượng
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowScrapDialog(true)}>
                Ghi nhận phế phẩm
              </Button>
              <Button
                size="sm"
                onClick={() => advanceMutation.mutate()}
                disabled={advanceMutation.isPending}
              >
                {advanceMutation.isPending ? 'Đang xử lý...' : 'Chuyển bước tiếp'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Steps */}
      <Card>
        <CardHeader><CardTitle className="text-base">Các bước sản xuất</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'stepOrder', label: 'Bước' },
              { key: 'operationName', label: 'Công đoạn' },
              { key: 'workCenterName', label: 'Trung tâm gia công' },
              {
                key: 'status',
                label: 'Trạng thái',
                render: (row: WorkOrderDetail['steps'][0]) => {
                  const s = statusMap[row.status] || { label: row.status, variant: 'default' as const };
                  return <Badge variant={s.variant}>{s.label}</Badge>;
                },
              },
              { key: 'cycleTimeMins', label: 'Thời gian (phút)' },
            ]}
            data={wo.steps}
            emptyMessage="Chưa có bước sản xuất"
          />
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card>
        <CardHeader><CardTitle className="text-base">Nhật ký sản xuất</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'stepOrder', label: 'Bước' },
              { key: 'operatorName', label: 'Công nhân' },
              { key: 'quantityProduced', label: 'Sản lượng' },
              { key: 'startTime', label: 'Bắt đầu', render: (row: WorkOrderDetail['executionLogs'][0]) => new Date(row.startTime).toLocaleString('vi-VN') },
              { key: 'endTime', label: 'Kết thúc', render: (row: WorkOrderDetail['executionLogs'][0]) => row.endTime ? new Date(row.endTime).toLocaleString('vi-VN') : '—' },
            ]}
            data={wo.executionLogs}
            emptyMessage="Chưa có nhật ký sản xuất"
          />
        </CardContent>
      </Card>

      {/* Scrap Logs */}
      {wo.scrapLogs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Phế phẩm</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'stepOrder', label: 'Bước' },
                { key: 'quantity', label: 'Số lượng' },
                { key: 'reason', label: 'Nguyên nhân' },
              ]}
              data={wo.scrapLogs}
            />
          </CardContent>
        </Card>
      )}

      {/* Execution Dialog */}
      <Dialog open={showExecDialog} onOpenChange={setShowExecDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ghi nhận sản lượng</DialogTitle></DialogHeader>
          <form onSubmit={handleLogExecution} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên công nhân</label>
              <Input value={execForm.operatorName} onChange={(e) => setExecForm({ ...execForm, operatorName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sản lượng</label>
              <Input type="number" min="1" value={execForm.quantityProduced} onChange={(e) => setExecForm({ ...execForm, quantityProduced: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowExecDialog(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Ghi nhận'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Scrap Dialog */}
      <Dialog open={showScrapDialog} onOpenChange={setShowScrapDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ghi nhận phế phẩm</DialogTitle></DialogHeader>
          <form onSubmit={handleLogScrap} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Số lượng</label>
              <Input type="number" min="1" value={scrapForm.quantity} onChange={(e) => setScrapForm({ ...scrapForm, quantity: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nguyên nhân</label>
              <Textarea value={scrapForm.reason} onChange={(e) => setScrapForm({ ...scrapForm, reason: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowScrapDialog(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Ghi nhận'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
