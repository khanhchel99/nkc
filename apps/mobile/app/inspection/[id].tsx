import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api, ApiError } from '@/lib/api';
import { colors, globalStyles } from '@/lib/theme';

interface ChecklistItem {
  id: string;
  check_point: string;
  method: string | null;
  accept_criteria: string | null;
  seq: number;
}

interface Defect {
  id: string;
  defect_type: string;
  description: string | null;
  qty: number;
  severity: string;
  created_at: string;
}

interface InspectionDetail {
  id: string;
  inspection_no: string;
  ref_type: string;
  result: string;
  inspected_qty: number;
  passed_qty: number;
  failed_qty: number;
  notes: string | null;
  inspected_at: string | null;
  qc_plans: {
    plan_name: string;
    qc_checklist_items: ChecklistItem[];
  } | null;
  qc_defects: Defect[];
}

const resultLabels: Record<string, string> = {
  pending: 'Chờ kiểm tra',
  passed: 'Đạt',
  failed: 'Không đạt',
  partial: 'Đạt 1 phần',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: colors.danger,
  major: '#f59e0b',
  minor: colors.textSecondary,
};

export default function InspectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: insp, isLoading, refetch } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => api.get<InspectionDetail>(`/quality/inspections/${id}`),
  });

  // Update result form
  const [passedQty, setPassedQty] = useState('');
  const [failedQty, setFailedQty] = useState('');
  const [resultNotes, setResultNotes] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  // Defect form
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [defectType, setDefectType] = useState('');
  const [defectQty, setDefectQty] = useState('');
  const [defectSeverity, setDefectSeverity] = useState('minor');
  const [defectDesc, setDefectDesc] = useState('');

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/quality/inspections/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', id] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      setShowUpdateForm(false);
      Alert.alert('Thành công', 'Đã cập nhật kết quả');
    },
    onError: (err) => Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Cập nhật thất bại'),
  });

  const defectMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post(`/quality/inspections/${id}/defects`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', id] });
      setShowDefectForm(false);
      setDefectType('');
      setDefectQty('');
      setDefectDesc('');
      Alert.alert('Thành công', 'Đã ghi nhận lỗi');
    },
    onError: (err) => Alert.alert('Lỗi', err instanceof ApiError ? err.message : 'Ghi nhận thất bại'),
  });

  function handleSubmitResult() {
    const passed = parseInt(passedQty) || 0;
    const failed = parseInt(failedQty) || 0;
    if (passed + failed <= 0) {
      Alert.alert('Lỗi', 'Nhập số lượng đạt hoặc không đạt');
      return;
    }
    const result = failed === 0 ? 'passed' : passed === 0 ? 'failed' : 'partial';
    updateMutation.mutate({ passedQty: passed, failedQty: failed, result, notes: resultNotes || undefined });
  }

  function handleSubmitDefect() {
    if (!defectType.trim()) {
      Alert.alert('Lỗi', 'Nhập loại lỗi');
      return;
    }
    defectMutation.mutate({
      defectType: defectType.trim(),
      qty: parseInt(defectQty) || 1,
      severity: defectSeverity,
      description: defectDesc || undefined,
    });
  }

  if (isLoading) {
    return <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!insp) {
    return <View style={globalStyles.container}><Text style={globalStyles.emptyText}>Không tìm thấy phiếu</Text></View>;
  }

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* Header */}
      <View style={[globalStyles.card, { marginTop: 12 }]}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{insp.inspection_no}</Text>
        <Text style={globalStyles.cardSubtitle}>{insp.qc_plans?.plan_name || 'Không có kế hoạch'}</Text>
        <View style={[globalStyles.row, { marginTop: 10, gap: 12 }]}>
          <View style={[styles.statBox, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>{insp.passed_qty}</Text>
            <Text style={styles.statLabel}>Đạt</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.statValue, { color: colors.danger }]}>{insp.failed_qty}</Text>
            <Text style={styles.statLabel}>Không đạt</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#f1f5f9' }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{insp.inspected_qty}</Text>
            <Text style={styles.statLabel}>Tổng KT</Text>
          </View>
        </View>
        <View style={{ marginTop: 12 }}>
          <Text style={styles.resultText}>Kết quả: {resultLabels[insp.result] || insp.result}</Text>
        </View>
      </View>

      {/* Checklist */}
      {insp.qc_plans?.qc_checklist_items && insp.qc_plans.qc_checklist_items.length > 0 && (
        <>
          <Text style={globalStyles.sectionTitle}>Checklist kiểm tra</Text>
          {insp.qc_plans.qc_checklist_items.map((item) => (
            <View key={item.id} style={globalStyles.card}>
              <View style={globalStyles.row}>
                <Ionicons name="checkbox-outline" size={18} color={colors.primary} />
                <Text style={[globalStyles.cardTitle, { marginLeft: 8 }]}>{item.check_point}</Text>
              </View>
              {item.accept_criteria && (
                <Text style={[globalStyles.cardSubtitle, { marginTop: 4 }]}>
                  Tiêu chí: {item.accept_criteria}
                </Text>
              )}
              {item.method && (
                <Text style={[globalStyles.cardSubtitle]}>Phương pháp: {item.method}</Text>
              )}
            </View>
          ))}
        </>
      )}

      {/* Update Result */}
      {insp.result === 'pending' && (
        <>
          <Text style={globalStyles.sectionTitle}>Cập nhật kết quả</Text>
          {!showUpdateForm ? (
            <TouchableOpacity style={[globalStyles.button, { marginHorizontal: 16 }]} onPress={() => setShowUpdateForm(true)}>
              <Text style={globalStyles.buttonText}>Nhập kết quả kiểm tra</Text>
            </TouchableOpacity>
          ) : (
            <View style={[globalStyles.card]}>
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>SL đạt</Text>
                  <TextInput style={styles.formInput} value={passedQty} onChangeText={setPassedQty} keyboardType="numeric" placeholder="0" />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>SL không đạt</Text>
                  <TextInput style={styles.formInput} value={failedQty} onChangeText={setFailedQty} keyboardType="numeric" placeholder="0" />
                </View>
              </View>
              <Text style={styles.formLabel}>Ghi chú</Text>
              <TextInput style={[styles.formInput, { height: 60 }]} value={resultNotes} onChangeText={setResultNotes} multiline placeholder="Ghi chú" />
              <TouchableOpacity
                style={[globalStyles.button, { marginTop: 10 }, updateMutation.isPending && { opacity: 0.6 }]}
                onPress={handleSubmitResult}
                disabled={updateMutation.isPending}
              >
                <Text style={globalStyles.buttonText}>{updateMutation.isPending ? 'Đang lưu...' : 'Lưu kết quả'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Defects */}
      <Text style={globalStyles.sectionTitle}>Lỗi phát hiện ({insp.qc_defects.length})</Text>
      {insp.qc_defects.map((d) => (
        <View key={d.id} style={globalStyles.card}>
          <View style={globalStyles.spaceBetween}>
            <Text style={globalStyles.cardTitle}>{d.defect_type}</Text>
            <Text style={[styles.severity, { color: SEVERITY_COLORS[d.severity] || colors.textSecondary }]}>
              {d.severity.toUpperCase()} × {d.qty}
            </Text>
          </View>
          {d.description && <Text style={globalStyles.cardSubtitle}>{d.description}</Text>}
        </View>
      ))}

      {/* Add Defect */}
      {!showDefectForm ? (
        <TouchableOpacity
          style={[globalStyles.button, { marginHorizontal: 16, backgroundColor: colors.danger }]}
          onPress={() => setShowDefectForm(true)}
        >
          <Text style={globalStyles.buttonText}>+ Ghi nhận lỗi</Text>
        </TouchableOpacity>
      ) : (
        <View style={[globalStyles.card]}>
          <Text style={styles.formTitle}>Ghi nhận lỗi mới</Text>
          <Text style={styles.formLabel}>Loại lỗi *</Text>
          <TextInput style={styles.formInput} value={defectType} onChangeText={setDefectType} placeholder="VD: Xước bề mặt" />
          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Số lượng</Text>
              <TextInput style={styles.formInput} value={defectQty} onChangeText={setDefectQty} keyboardType="numeric" placeholder="1" />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Mức độ</Text>
              <View style={styles.severityRow}>
                {(['minor', 'major', 'critical'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sevBtn, defectSeverity === s && { backgroundColor: SEVERITY_COLORS[s], borderColor: SEVERITY_COLORS[s] }]}
                    onPress={() => setDefectSeverity(s)}
                  >
                    <Text style={[styles.sevBtnText, defectSeverity === s && { color: '#fff' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.formLabel}>Mô tả</Text>
          <TextInput style={[styles.formInput, { height: 50 }]} value={defectDesc} onChangeText={setDefectDesc} multiline placeholder="Mô tả chi tiết" />
          <View style={[globalStyles.row, { gap: 10, marginTop: 10 }]}>
            <TouchableOpacity style={[globalStyles.button, { flex: 1, backgroundColor: colors.textMuted }]} onPress={() => setShowDefectForm(false)}>
              <Text style={globalStyles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[globalStyles.button, { flex: 1, backgroundColor: colors.danger }, defectMutation.isPending && { opacity: 0.6 }]}
              onPress={handleSubmitDefect}
              disabled={defectMutation.isPending}
            >
              <Text style={globalStyles.buttonText}>{defectMutation.isPending ? 'Đang lưu...' : 'Ghi nhận'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  resultText: { fontSize: 15, fontWeight: '600', color: colors.text },
  severity: { fontSize: 12, fontWeight: '700' },
  formTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 10 },
  formField: { flex: 1 },
  formLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4, marginTop: 8 },
  formInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  severityRow: { flexDirection: 'row', gap: 6 },
  sevBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sevBtnText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
});
