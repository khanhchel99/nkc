import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { api, ApiError } from '@/lib/api';
import { colors, globalStyles } from '@/lib/theme';

interface WorkOrder {
  id: string;
  wo_number: string;
  status: string;
}

interface WOResponse {
  data: WorkOrder[];
  total: number;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || searching) return;
    setScanned(true);
    setSearching(true);

    try {
      // Try to find work order by scanned code (wo_number)
      const result = await api.get<WOResponse>('/production/work-orders', {
        limit: '1',
        search: data.trim(),
      });

      if (result.data.length > 0) {
        router.replace(`/work-order/${result.data[0].id}`);
      } else {
        Alert.alert(
          'Không tìm thấy',
          `Không tìm thấy lệnh SX với mã: ${data}`,
          [{ text: 'Quét lại', onPress: () => { setScanned(false); setSearching(false); } }],
        );
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Lỗi khi tìm kiếm';
      Alert.alert('Lỗi', msg, [
        { text: 'Quét lại', onPress: () => { setScanned(false); setSearching(false); } },
      ]);
    }
  }

  if (!permission) {
    return <View style={globalStyles.container}><Text style={globalStyles.emptyText}>Đang tải camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={{ fontSize: 16, color: colors.text, textAlign: 'center', marginBottom: 16 }}>
          Cần quyền truy cập camera để quét mã vạch
        </Text>
        <TouchableOpacity style={globalStyles.button} onPress={requestPermission}>
          <Text style={globalStyles.buttonText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.hint}>
            {searching ? 'Đang tìm kiếm...' : 'Hướng camera vào mã vạch lệnh sản xuất'}
          </Text>
        </View>
      </CameraView>
      {scanned && !searching && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
          <Text style={globalStyles.buttonText}>Quét lại</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const CORNER_SIZE = 30;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: '#fff' },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: '#fff' },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderColor: '#fff' },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderColor: '#fff' },
  hint: { color: '#fff', fontSize: 14, marginTop: 24, textAlign: 'center', paddingHorizontal: 32 },
  rescanBtn: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
});
