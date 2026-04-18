import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'NKC ERP', headerShown: false }} />
    </Stack>
  );
}
