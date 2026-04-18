import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError } from '@/lib/api';
import { colors, globalStyles } from '@/lib/theme';

interface Step {
  id: string;
  step_no: number;
  operation_name: string;
  status: string;
  planned_qty: number;
  completed_qty: number;
  scrapped_qty: number;
  work_order_executions: Execution[];
}

interface Execution {
  id: string;
  started_at: string;
  ended_at: string | null;
  input_qty: number;
  output_qty: number;
  scrap_qty: number;
  notes: string | null;
}

interface WorkOrderDetail {
  id: string;
  wo_number: string;
  status: string;
  priority: string;
  planned_qty: number;
  completed_qty: number;
  scrapped_qty: number;
  work_order_steps: Step[];
}

const stepStatusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ', color: '#94a3b8', bg: '#f1f5f9' },
  ready: { label: 'Sẵn sàng', color: '#2563eb', bg: '#eff6ff' },
  in_progress: { label: 'Đang chạy', color: '#f59e0b', bg: '#fef3c7' },
  paused: { label: 'Tạm dừng', color: '#dc2626', bg: '#fee2e2' },
  completed: { label: 'Xong', color: '#16a34a', bg: '#dcfce7' },
  cancelled: { label: 'Hủy', color: '#94a3b8', bg: '#f1f5f9' },
};

export default function WorkOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: wo, isLoading, refetch } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => api.get<WorkOrderDetail>(`/production/work-orders/${id}`),
  });

  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [outputQty, setOutputQty] = useState('');
  const [scrapQty, setScrapQty] = useState('');
  const [notes, setNotes] = useState('');

  const stepMutation = useMutation({
    mutationFn: ({ stepId, status }: { stepId: string; status: string }) =>
      api.patch(`/production/work-orders/${id}/steps/${stepId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
    onError: (err) => Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Thao tác thất bại'),
  });

  const execMutation = useMutation({
    mutationFn: ({ stepId, body }: { stepId: string; body: Record<string, unknown> }) =>
      api.post(`/production/work-orders/${id}/steps/${stepId}/executions`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-order', id] });
      setOutputQty('');
      setScrapQty('');
      setNotes('');
      setActiveStep(null);
      Alert.alert('Thành công', 'Đã ghi nhận sản lượng');
    },
    onError: (err) => Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Ghi nhận thất bại'),
  });

  function handleStepAction(step: Step) {
    const nextStatusMap: Record<string, string> = {
      pending: 'ready',
      ready: 'in_progress',
      paused: 'in_progress',
    };
    const next = nextStatusMap[step.status];
    if (next) {
      const labels: Record<string, string> = {
        ready: 'Chuyển sang Sẵn sàng?',
        in_progress: 'Bắt đầu sản xuất?',
      };
      Alert.alert('Xác nhận', labels[next] || `Chuyển sang ${next}?`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', onPress: () => stepMutation.mutate({ stepId: step.id, status: next }) },
      ]);
    } else if (step.status === 'in_progress') {
      setActiveStep(activeStep === step.id ? null : step.id);
    }
  }

  function submitExecution(stepId: string) {
    const output = parseInt(outputQty) || 0;
    const scrap = parseInt(scrapQty) || 0;
    if (output <= 0) {
      Alert.alert('Lỗi', 'Số lượng đầu ra phải > 0');
      return;
    }
    execMutation.mutate({
      stepId,
      body: {
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        inputQty: output + scrap,
        outputQty: output,
        scrapQty: scrap,
        notes: notes || undefined,
      },
    });
  }

  function handleCompleteStep(step: Step) {
    Alert.alert('Hoàn thành bước?', `Đánh dấu "${step.operation_name}" là hoàn thành?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Hoàn thành', onPress: () => stepMutation.mutate({ stepId: step.id, status: 'completed' }) },
    ]);
  }

  function handlePauseStep(step: Step) {
    stepMutation.mutate({ stepId: step.id, status: 'paused' });
  }

  if (isLoading) {
    return <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!wo) {
    return <View style={globalStyles.container}><Text style={globalStyles.emptyText}>Không tìm thấy lệnh sản xuất</Text></View>;
  }

  const overallProgress = wo.planned_qty > 0 ? Math.round((wo.completed_qty / wo.planned_qty) * 100) : 0;

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* Header Card */}
      <View style={[globalStyles.card, { marginTop: 12 }]}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{wo.wo_number}</Text>
        <View style={[globalStyles.row, { marginTop: 8, gap: 16 }]}>
          <Text style={styles.infoLabel}>SL kế hoạch: <Text style={styles.infoValue}>{wo.planned_qty}</Text></Text>
          <Text style={styles.infoLabel}>Hoàn thành: <Text style={styles.infoValue}>{wo.completed_qty}</Text></Text>
          <Text style={styles.infoLabel}>Phế: <Text style={[styles.infoValue, { color: colors.danger }]}>{wo.scrapped_qty}</Text></Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(overallProgress, 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>{overallProgress}% hoàn thành</Text>
      </View>

      {/* Steps */}
      <Text style={globalStyles.sectionTitle}>Các bước sản xuất</Text>
      {wo.work_order_steps.map((step) => {
        const s = stepStatusMap[step.status] || stepStatusMap.pending;
        const isActive = activeStep === step.id;
        const stepProgress = step.planned_qty > 0 ? Math.round((step.completed_qty / step.planned_qty) * 100) : 0;

        return (
          <View key={step.id} style={globalStyles.card}>
            <View style={globalStyles.spaceBetween}>
              <View style={[globalStyles.row, { gap: 8, flex: 1 }]}>
                <View style={[styles.stepNo, { backgroundColor: s.bg }]}>
                  <Text style={[styles.stepNoText, { color: s.color }]}>{step.step_no}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={globalStyles.cardTitle}>{step.operation_name}</Text>
                  <Text style={globalStyles.cardSubtitle}>
                    {step.completed_qty}/{step.planned_qty} ({stepProgress}%)
                    {step.scrapped_qty > 0 ? ` · Phế: ${step.scrapped_qty}` : ''}
                  </Text>
                </View>
              </View>
              <View style={[globalStyles.badge, { backgroundColor: s.bg }]}>
                <Text style={[globalStyles.badgeText, { color: s.color }]}>{s.label}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={[styles.actions, { marginTop: 10 }]}>
              {(step.status === 'pending' || step.status === 'ready' || step.status === 'paused') && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleStepAction(step)}>
                  <Ionicons name="play" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>
                    {step.status === 'pending' ? 'Sẵn sàng' : 'Bắt đầu'}
                  </Text>
                </TouchableOpacity>
              )}
              {step.status === 'in_progress' && (
                <>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => handleStepAction(step)}>
                    <Ionicons name="add-circle-outline" size={16} color="#fff" />
                    <Text style={styles.actionBtnText}>Ghi sản lượng</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.warning }]} onPress={() => handlePauseStep(step)}>
                    <Ionicons name="pause" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.danger }]} onPress={() => handleCompleteStep(step)}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Execution Form */}
            {isActive && step.status === 'in_progress' && (
              <View style={styles.execForm}>
                <Text style={styles.execFormTitle}>Ghi nhận sản lượng</Text>
                <View style={styles.execRow}>
                  <View style={styles.execField}>
                    <Text style={styles.execLabel}>SL đầu ra *</Text>
                    <TextInput
                      style={styles.execInput}
                      value={outputQty}
                      onChangeText={setOutputQty}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <View style={styles.execField}>
                    <Text style={styles.execLabel}>SL phế phẩm</Text>
                    <TextInput
                      style={styles.execInput}
                      value={scrapQty}
                      onChangeText={setScrapQty}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                </View>
                <Text style={styles.execLabel}>Ghi chú</Text>
                <TextInput
                  style={[styles.execInput, { height: 60 }]}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholder="Ghi chú (tùy chọn)"
                />
                <TouchableOpacity
                  style={[globalStyles.button, { marginTop: 10 }, execMutation.isPending && { opacity: 0.6 }]}
                  onPress={() => submitExecution(step.id)}
                  disabled={execMutation.isPending}
                >
                  {execMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={globalStyles.buttonText}>Xác nhận</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Recent executions */}
            {step.work_order_executions.length > 0 && (
              <View style={styles.execList}>
                {step.work_order_executions.slice(0, 3).map((ex) => (
                  <View key={ex.id} style={styles.execItem}>
                    <Text style={styles.execItemText}>
                      ✓ {ex.output_qty} ok{ex.scrap_qty > 0 ? ` · ${ex.scrap_qty} phế` : ''}
                    </Text>
                    <Text style={styles.execItemTime}>
                      {new Date(ex.started_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  infoLabel: { fontSize: 13, color: colors.textSecondary },
  infoValue: { fontWeight: '600', color: colors.text },
  progressTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'right' },
  stepNo: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  execForm: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  execFormTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  execRow: { flexDirection: 'row', gap: 10 },
  execField: { flex: 1 },
  execLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, marginTop: 6 },
  execInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  execList: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  execItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  execItemText: { fontSize: 13, color: colors.text },
  execItemTime: { fontSize: 12, color: colors.textMuted },
});
