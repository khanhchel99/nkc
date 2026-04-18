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
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';

interface InspectionDetail {
  inspectionId: string;
  inspectionNumber: string;
  workOrderNumber: string;
  status: string;
  inspectorName: string | null;
  result: string | null;
  notes: string | null;
  checklist: {
    checkId: string;
    checkName: string;
    expected: string;
    actual: string | null;
    passed: boolean | null;
  }[];
  defects: {
    defectId: string;
    defectType: string;
    severity: string;
    description: string;
    disposition: string | null;
  }[];
}

const statusLabels: Record<string, string> = {
  pending: 'Chờ kiểm tra',
  in_progress: 'Đang kiểm tra',
  passed: 'Đạt',
  failed: 'Không đạt',
  conditional: 'Đạt có điều kiện',
};

export default function InspectionDetailPage() {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const queryClient = useQueryClient();
  const [showDefectDialog, setShowDefectDialog] = useState(false);
  const [defectForm, setDefectForm] = useState({ defectType: '', severity: 'minor', description: '', disposition: '' });
  const [saving, setSaving] = useState(false);

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => api.get<InspectionDetail>(`/api/quality/inspections/${inspectionId}`),
    enabled: !!inspectionId,
  });

  const recordResultMutation = useMutation({
    mutationFn: (result: string) =>
      api.post(`/api/quality/inspections/${inspectionId}/result`, { result }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] }),
  });

  async function handleAddDefect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/quality/inspections/${inspectionId}/defects`, {
        defectType: defectForm.defectType,
        severity: defectForm.severity,
        description: defectForm.description,
        disposition: defectForm.disposition || null,
      });
      setShowDefectDialog(false);
      setDefectForm({ defectType: '', severity: 'minor', description: '', disposition: '' });
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="text-muted-foreground">Đang tải...</div>;
  if (!inspection) return <div className="text-muted-foreground">Không tìm thấy phiếu kiểm tra</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phiếu kiểm tra {inspection.inspectionNumber}</h1>
          <p className="text-muted-foreground">Lệnh SX: {inspection.workOrderNumber}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{statusLabels[inspection.status] || inspection.status}</Badge>
          {(inspection.status === 'pending' || inspection.status === 'in_progress') && (
            <>
              <Button size="sm" variant="outline" onClick={() => recordResultMutation.mutate('passed')} disabled={recordResultMutation.isPending}>
                Đạt
              </Button>
              <Button size="sm" variant="destructive" onClick={() => recordResultMutation.mutate('failed')} disabled={recordResultMutation.isPending}>
                Không đạt
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Checklist */}
      <Card>
        <CardHeader><CardTitle className="text-base">Danh sách kiểm tra</CardTitle></CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'checkName', label: 'Tiêu chí' },
              { key: 'expected', label: 'Giá trị mong đợi' },
              { key: 'actual', label: 'Giá trị thực tế', render: (row: InspectionDetail['checklist'][0]) => row.actual || '—' },
              {
                key: 'passed',
                label: 'Kết quả',
                render: (row: InspectionDetail['checklist'][0]) =>
                  row.passed === null ? '—' : row.passed ? <Badge variant="success">Đạt</Badge> : <Badge variant="destructive">Không đạt</Badge>,
              },
            ]}
            data={inspection.checklist}
            emptyMessage="Chưa có tiêu chí kiểm tra"
          />
        </CardContent>
      </Card>

      {/* Defects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Khiếm khuyết</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowDefectDialog(true)}>
            Thêm khiếm khuyết
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'defectType', label: 'Loại' },
              {
                key: 'severity',
                label: 'Mức độ',
                render: (row: InspectionDetail['defects'][0]) => {
                  const map: Record<string, { label: string; variant: 'default' | 'warning' | 'destructive' }> = {
                    minor: { label: 'Nhẹ', variant: 'default' },
                    major: { label: 'Nghiêm trọng', variant: 'warning' },
                    critical: { label: 'Nguy hiểm', variant: 'destructive' },
                  };
                  const s = map[row.severity] || { label: row.severity, variant: 'default' as const };
                  return <Badge variant={s.variant}>{s.label}</Badge>;
                },
              },
              { key: 'description', label: 'Mô tả' },
              {
                key: 'disposition',
                label: 'Xử lý',
                render: (row: InspectionDetail['defects'][0]) => {
                  const map: Record<string, string> = { rework: 'Sửa lại', scrap: 'Phế phẩm', accept_as_is: 'Chấp nhận', return_to_supplier: 'Trả NCC' };
                  return row.disposition ? map[row.disposition] || row.disposition : '—';
                },
              },
            ]}
            data={inspection.defects}
            emptyMessage="Không có khiếm khuyết"
          />
        </CardContent>
      </Card>

      {/* Notes */}
      {inspection.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Ghi chú</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{inspection.notes}</p></CardContent>
        </Card>
      )}

      {/* Defect Dialog */}
      <Dialog open={showDefectDialog} onOpenChange={setShowDefectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm khiếm khuyết</DialogTitle></DialogHeader>
          <form onSubmit={handleAddDefect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Loại khiếm khuyết</label>
              <Input value={defectForm.defectType} onChange={(e) => setDefectForm({ ...defectForm, defectType: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mức độ</label>
              <Select
                value={defectForm.severity}
                onChange={(e) => setDefectForm({ ...defectForm, severity: e.target.value })}
                options={[
                  { value: 'minor', label: 'Nhẹ' },
                  { value: 'major', label: 'Nghiêm trọng' },
                  { value: 'critical', label: 'Nguy hiểm' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <Textarea value={defectForm.description} onChange={(e) => setDefectForm({ ...defectForm, description: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cách xử lý</label>
              <Select
                value={defectForm.disposition}
                onChange={(e) => setDefectForm({ ...defectForm, disposition: e.target.value })}
                options={[
                  { value: '', label: 'Chưa quyết định' },
                  { value: 'rework', label: 'Sửa lại' },
                  { value: 'scrap', label: 'Phế phẩm' },
                  { value: 'accept_as_is', label: 'Chấp nhận nguyên trạng' },
                  { value: 'return_to_supplier', label: 'Trả nhà cung cấp' },
                ]}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDefectDialog(false)}>Hủy</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Thêm'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
