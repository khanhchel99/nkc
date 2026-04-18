import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

type TabIcon = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { borderTopColor: colors.border, paddingBottom: 4 },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, size }) => <Ionicons name={'home-outline' as TabIcon} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="production"
        options={{
          title: 'Sản xuất',
          tabBarIcon: ({ color, size }) => <Ionicons name={'construct-outline' as TabIcon} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="quality"
        options={{
          title: 'Chất lượng',
          tabBarIcon: ({ color, size }) => <Ionicons name={'checkmark-circle-outline' as TabIcon} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Kho',
          tabBarIcon: ({ color, size }) => <Ionicons name={'cube-outline' as TabIcon} size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => <Ionicons name={'person-outline' as TabIcon} size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
