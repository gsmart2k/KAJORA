import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { KajoraProvider } from '@/state/kajora-context';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <KajoraProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />
    </KajoraProvider>
  );
}
