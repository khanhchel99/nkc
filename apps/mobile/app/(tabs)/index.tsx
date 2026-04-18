import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { colors, globalStyles } from '@/lib/theme';

interface PaginatedResponse {
  data: unknown[];
  total: number;
}

export default function DashboardScreen() {
  const user = useAuthStore((s) => s.user);

  const { data: orders, refetch: r1 } = useQuery({
    queryKey: ['kpi-orders'],
    queryFn: () => api.get<PaginatedResponse>('/sales-orders', { status: 'confirmed', limit: '1' }),
  });

  const { data: production, refetch: r2 } = useQuery({
    queryKey: ['kpi-production'],
    queryFn: () => api.get<PaginatedResponse>('/production/work-orders', { status: 'in_progress', limit: '1' }),
  });

  const { data: qc, refetch: r3 } = useQuery({
    queryKey: ['kpi-qc'],
    queryFn: () => api.get<PaginatedResponse>('/quality/inspections', { result: 'pending', limit: '1' }),
  });

  const { data: shipping, refetch: r4 } = useQuery({
    queryKey: ['kpi-shipping'],
    queryFn: () => api.get<PaginatedResponse>('/shipping/shipments', { status: 'planned', limit: '1' }),
  });

  const refreshAll = async () => {
    await Promise.all([r1(), r2(), r3(), r4()]);
  };

  const kpis = [
    { label: 'Đơn hàng đang xử lý', value: orders?.total ?? '—', icon: 'receipt-outline', color: colors.primary },
    { label: 'Đang sản xuất', value: production?.total ?? '—', icon: 'construct-outline', color: colors.warning },
    { label: 'Chờ kiểm tra CL', value: qc?.total ?? '—', icon: 'checkmark-circle-outline', color: colors.danger },
    { label: 'Sẵn sàng giao', value: shipping?.total ?? '—', icon: 'airplane-outline', color: colors.success },
  ];

  const shortcuts = [
    { label: 'Quét lệnh SX', icon: 'scan-outline', onPress: () => router.push('/scanner') },
    { label: 'Lệnh sản xuất', icon: 'construct-outline', onPress: () => router.push('/(tabs)/production') },
    { label: 'Kiểm tra CL', icon: 'checkmark-circle-outline', onPress: () => router.push('/(tabs)/quality') },
    { label: 'Kho hàng', icon: 'cube-outline', onPress: () => router.push('/(tabs)/inventory') },
  ];

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refreshAll} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Xin chào, {user?.fullName?.split(' ').pop() || 'Bạn'} 👋</Text>
        <Text style={styles.role}>{user?.roles?.join(', ')}</Text>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <View key={kpi.label} style={styles.kpiCard}>
            <Ionicons name={kpi.icon as keyof typeof Ionicons.glyphMap} size={24} color={kpi.color} />
            <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={globalStyles.sectionTitle}>Thao tác nhanh</Text>
      <View style={styles.shortcuts}>
        {shortcuts.map((s) => (
          <TouchableOpacity key={s.label} style={styles.shortcutBtn} onPress={s.onPress}>
            <View style={styles.shortcutIcon}>
              <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={26} color={colors.primary} />
            </View>
            <Text style={styles.shortcutLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  role: { fontSize: 13, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 12,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  kpiValue: { fontSize: 28, fontWeight: 'bold', marginTop: 6 },
  kpiLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  shortcutBtn: {
    width: '23%',
    alignItems: 'center',
    margin: '1%',
    paddingVertical: 12,
  },
  shortcutIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shortcutLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
});
