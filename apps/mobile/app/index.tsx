import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HomeScreen() {
  const modules = [
    { title: 'My Tasks', icon: '📋' },
    { title: 'Scan Work Order', icon: '📱' },
    { title: 'Production', icon: '🏭' },
    { title: 'QC Inspection', icon: '✅' },
    { title: 'Warehouse', icon: '📦' },
    { title: 'Alerts', icon: '🔔' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>NKC ERP</Text>
      <Text style={styles.subtitle}>Shopfloor Mobile</Text>
      <View style={styles.grid}>
        {modules.map((mod) => (
          <TouchableOpacity key={mod.title} style={styles.card}>
            <Text style={styles.icon}>{mod.icon}</Text>
            <Text style={styles.cardTitle}>{mod.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 60 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  icon: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
});
