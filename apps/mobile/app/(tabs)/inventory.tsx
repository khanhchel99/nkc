import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, globalStyles } from '@/lib/theme';

interface StockBalance {
  id: string;
  item_id: string;
  warehouse_id: string;
  bin_location: string | null;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
  items: { item_code: string; item_name: string; uom: string };
  warehouses: { wh_code: string; wh_name: string };
}

interface StockResponse {
  data: StockBalance[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export default function InventoryScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    debounceRef[0] = setTimeout(() => setDebouncedSearch(text), 400);
  }, []);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stock-balances', debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (debouncedSearch) params.set('search', debouncedSearch);
      return api.get<StockResponse>(`/inventory/stock-balances?${params}`);
    },
  });

  function renderItem({ item }: { item: StockBalance }) {
    const available = item.qty_available;
    const lowStock = available <= 0;

    return (
      <View style={globalStyles.card}>
        <View style={globalStyles.spaceBetween}>
          <View style={{ flex: 1 }}>
            <Text style={globalStyles.cardTitle}>{item.items.item_name}</Text>
            <Text style={globalStyles.cardSubtitle}>{item.items.item_code}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.qtyMain, lowStock && { color: colors.danger }]}>
              {available} {item.items.uom}
            </Text>
            <Text style={styles.qtyLabel}>Khả dụng</Text>
          </View>
        </View>

        <View style={[styles.detailRow, { marginTop: 10 }]}>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>{item.warehouses.wh_name}</Text>
          </View>
          {item.bin_location && (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.detailText}>{item.bin_location}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>Tồn kho</Text>
            <Text style={styles.statChipValue}>{item.qty_on_hand}</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>Đã giữ</Text>
            <Text style={[styles.statChipValue, item.qty_reserved > 0 && { color: '#f59e0b' }]}>
              {item.qty_reserved}
            </Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipLabel}>Khả dụng</Text>
            <Text style={[styles.statChipValue, lowStock && { color: colors.danger }]}>
              {available}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearch}
          placeholder="Tìm vật tư, mã SP..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={<Text style={globalStyles.emptyText}>Không có dữ liệu tồn kho</Text>}
          ListHeaderComponent={
            data ? (
              <Text style={styles.countText}>{data.pagination.total} mục</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 15, color: colors.text },
  countText: { fontSize: 12, color: colors.textSecondary, paddingHorizontal: 16, paddingVertical: 6 },
  qtyMain: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  qtyLabel: { fontSize: 11, color: colors.textSecondary },
  detailRow: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 13, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statChip: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statChipLabel: { fontSize: 10, color: colors.textSecondary },
  statChipValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
});
