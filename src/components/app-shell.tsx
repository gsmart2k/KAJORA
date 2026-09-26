import type { PropsWithChildren } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, contentWidth, radius, spacing } from '@/theme';

type RouteName = 'home' | 'groups' | 'create' | 'profile' | 'none';

const items: { key: Exclude<RouteName, 'none'>; label: string; route: '/' | '/groups' | '/create' | '/profile' }[] = [
  { key: 'home', label: 'Home', route: '/' },
  { key: 'groups', label: 'Groups', route: '/groups' },
  { key: 'create', label: 'Post', route: '/create' },
  { key: 'profile', label: 'Profile', route: '/profile' },
];

export function AppShell({ children, activeRoute = 'none' }: PropsWithChildren<{ activeRoute?: RouteName }>) {
  const router = useRouter();
  return (
    <View style={styles.page}>
      <SafeAreaView edges={['top']} style={styles.shell}>
        <View style={styles.body}>{children}</View>
        {activeRoute !== 'none' && (
          <View style={styles.navWrap}>
            <View accessibilityRole="tablist" style={styles.nav}>
              {items.map((item) => {
                const selected = activeRoute === item.key;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    key={item.key}
                    onPress={() => router.navigate(item.route)}
                    style={({ pressed }) => [
                      styles.navItem,
                      item.key === 'create' && styles.createItem,
                      selected && item.key !== 'create' && styles.navItemSelected,
                      pressed && styles.pressed,
                    ]}>
                    {item.key === 'create' && <Text style={styles.plus}>＋</Text>}
                    <Text
                      style={[
                        styles.navLabel,
                        selected && styles.navLabelSelected,
                        item.key === 'create' && styles.createLabel,
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Platform.OS === 'web' ? '#EEE9DE' : colors.canvas, flex: 1 },
  shell: {
    alignSelf: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    maxWidth: contentWidth,
    width: '100%',
  },
  body: { flex: 1 },
  navWrap: { backgroundColor: colors.canvas, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  nav: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 62,
    paddingHorizontal: spacing.sm,
  },
  navItem: { alignItems: 'center', borderRadius: radius.md, justifyContent: 'center', minWidth: 66, paddingVertical: 9 },
  navItemSelected: { backgroundColor: colors.sageSoft },
  createItem: { backgroundColor: colors.green, flexDirection: 'row', gap: 2, paddingHorizontal: 13 },
  navLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  navLabelSelected: { color: colors.greenDark },
  createLabel: { color: colors.paper },
  plus: { color: colors.paper, fontSize: 17, lineHeight: 18 },
  pressed: { opacity: 0.76 },
});
