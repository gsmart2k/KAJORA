import { ActivityProvider } from '@/state/activity-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Wordmark } from '@/components/ui';
import { AuthProvider, useAuth } from '@/state/auth-context';
import { KajoraProvider } from '@/state/kajora-context';
import { colors } from '@/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AccountContent />
    </AuthProvider>
  );
}

function AccountContent() {
  const { session } = useAuth();
  return (
    <KajoraProvider key={session?.userId ?? 'signed-out'}>
      <ActivityProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </ActivityProvider>
    </KajoraProvider>
  );
}

function RootNavigator() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={{ alignItems: 'center', backgroundColor: colors.white, flex: 1, justifyContent: 'center' }}>
        <Wordmark />
      </SafeAreaView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="auth/phone" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session && !session.profileComplete)}>
        <Stack.Screen name="auth/profile" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session?.profileComplete)}>
        <Stack.Screen name="index" />
        <Stack.Screen name="create" />
        <Stack.Screen name="groups" />
        <Stack.Screen name="groups/[id]" />
        <Stack.Screen name="intents/[id]" />
        <Stack.Screen name="profile" />
      </Stack.Protected>
    </Stack>
  );
}
