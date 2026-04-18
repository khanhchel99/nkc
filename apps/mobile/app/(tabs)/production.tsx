import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, globalStyles } from '@/lib/theme';

interface WorkOrder {
  id: string;
  wo_number: string;
  status: string;
  priority: string;
  planned_qty: number;
  completed_qty: number;
  work_order_steps: { id: string; status: string }[];
  created_at: string;
}

interface WOResponse {
  data: WorkOrder[];
  total: number;
  page: number;
  totalPages: number;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Nháp', color: '#64748b', bg: '#f1f5f9' },
  released: { label: 'Đã phát', color: '#2563eb', bg: '#eff6ff' },
  'in_progress': { label: 'Đang SX', color: '#f59e0b', bg: '#fef3c7' },
  completed: { label: 'Hoàn thành', color: '#16a34a', bg: '#dcfce7' },
  'on_hold': { label: 'Tạm dừng', color: '#dc2626', bg: '#fee2e2' },
  cancelled: { label: 'Đã hủy', color: '#94a3b8', bg: '#f1f5f9' },
};

const STATUS_FILTERS = ['all', 'released', 'in_progress', 'completed', 'on_hold'] as const;

export default function ProductionScreen() {
  const [filter, setFilter] = useState<string>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['work-orders', filter],
    queryFn: () =>
      api.get<WOResponse>('/production/work-orders', {
        limit: '50',
        ...(filter !== 'all' && { status: filter }),
      }),
  });

  function renderItem({ item }: { item: WorkOrder }) {
    const s = statusMap[item.status] || statusMap.draft;
    const progress = item.planned_qty > 0 ? Math.round((item.completed_qty / item.planned_qty) * 100) : 0;
    const stepsCompleted = item.work_order_steps.filter((st) => st.status === 'completed').length;

    return (
      <TouchableOpacity
        style={globalStyles.card}
        onPress={() => router.push(`/work-order/${item.id}`)}
      >
        <View style={globalStyles.spaceBetween}>
          <Text style={globalStyles.cardTitle}>{item.wo_number}</Text>
          <View style={[globalStyles.badge, { backgroundColor: s.bg }]}>
            <Text style={[globalStyles.badgeText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>
        <View style={[globalStyles.row, { marginTop: 8, gap: 16 }]}>
          <View style={globalStyles.row}>
            <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.meta}> {item.completed_qty}/{item.planned_qty} ({progress}%)</Text>
          </View>
          <View style={globalStyles.row}>
            <Ionicons name="git-branch-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.meta}> {stepsCompleted}/{item.work_order_steps.length} bước</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Filter chips */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(i) => i}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        renderItem={({ item: f }) => {
          const active = f === filter;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f === 'all' ? 'Tất cả' : (statusMap[f]?.label ?? f)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={data?.data ?? []}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={<Text style={globalStyles.emptyText}>Chưa có lệnh sản xuất</Text>}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { fontSize: 13, color: colors.textSecondary },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  filters: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
