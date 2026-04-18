import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, globalStyles } from '@/lib/theme';

interface Inspection {
  id: string;
  inspection_no: string;
  ref_type: string;
  ref_id: string;
  result: string;
  inspected_qty: number;
  passed_qty: number;
  failed_qty: number;
  inspected_at: string | null;
  qc_plans: { plan_name: string } | null;
}

interface InspResponse {
  data: Inspection[];
  total: number;
}

const resultMap: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: 'Chờ kiểm tra', color: '#f59e0b', bg: '#fef3c7', icon: 'time-outline' },
  passed: { label: 'Đạt', color: '#16a34a', bg: '#dcfce7', icon: 'checkmark-circle' },
  failed: { label: 'Không đạt', color: '#dc2626', bg: '#fee2e2', icon: 'close-circle' },
  partial: { label: 'Đạt 1 phần', color: '#f59e0b', bg: '#fef3c7', icon: 'alert-circle' },
};

const refTypeLabels: Record<string, string> = {
  work_order_step: 'Công đoạn SX',
  incoming_receipt: 'Nhập kho',
  shipment: 'Giao hàng',
};

export default function QualityScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => api.get<InspResponse>('/quality/inspections', { limit: '50' }),
  });

  function renderItem({ item }: { item: Inspection }) {
    const r = resultMap[item.result] || resultMap.pending;

    return (
      <TouchableOpacity
        style={globalStyles.card}
        onPress={() => router.push(`/inspection/${item.id}`)}
      >
        <View style={globalStyles.spaceBetween}>
          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardTitle}>{item.inspection_no}</Text>
            <Text style={globalStyles.cardSubtitle}>
              {item.qc_plans?.plan_name || 'Không có kế hoạch'}
            </Text>
          </View>
          <View style={[globalStyles.badge, { backgroundColor: r.bg }]}>
            <Ionicons name={r.icon as keyof typeof Ionicons.glyphMap} size={12} color={r.color} />
            <Text style={[globalStyles.badgeText, { color: r.color, marginLeft: 3 }]}>{r.label}</Text>
          </View>
        </View>
        <View style={[globalStyles.row, { marginTop: 8, gap: 16 }]}>
          <Text style={styles.meta}>📋 {refTypeLabels[item.ref_type] || item.ref_type}</Text>
          <Text style={styles.meta}>
            ✅ {item.passed_qty} · ❌ {item.failed_qty} / {item.inspected_qty}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={globalStyles.container}>
      <FlatList
        data={data?.data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={globalStyles.emptyText}>Chưa có phiếu kiểm tra</Text>}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { fontSize: 13, color: colors.textSecondary },
});
