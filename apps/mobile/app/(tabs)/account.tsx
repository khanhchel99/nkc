import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth-store';
import { colors, globalStyles } from '@/lib/theme';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={globalStyles.container}>
      {/* Profile Card */}
      <View style={[globalStyles.card, { marginTop: 16, alignItems: 'center' }]}>  
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.fullName || 'Người dùng'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
        {user?.roles && user.roles.length > 0 && (
          <View style={styles.rolesRow}>
            {user.roles.map((role: string) => (
              <View key={role} style={styles.roleBadge}>
                <Text style={styles.roleText}>{role}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info */}
      <Text style={globalStyles.sectionTitle}>Thông tin</Text>
      <View style={globalStyles.card}>
        <InfoRow icon="business-outline" label="Tenant ID" value={user?.tenantId || '—'} />
        <InfoRow icon="shield-checkmark-outline" label="Quyền hạn" value={`${user?.permissions?.length ?? 0} quyền`} />
      </View>

      {/* Actions */}
      <Text style={globalStyles.sectionTitle}>Hành động</Text>
      <TouchableOpacity style={[globalStyles.card, { flexDirection: 'row', alignItems: 'center' }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        <Text style={[styles.actionText, { color: colors.danger }]}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  rolesRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  roleBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  infoLabel: { flex: 1, fontSize: 14, color: colors.textSecondary, marginLeft: 10 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500' },
  actionText: { fontSize: 16, fontWeight: '600', marginLeft: 10 },
});
