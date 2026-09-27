import type { PropsWithChildren } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, contentWidth, radius, spacing } from '@/theme';

type RouteName = 'home' | 'groups' | 'create' | 'profile' | 'none';

type NavItem = {
  key: Exclude<RouteName, 'none'>;
  label: string;
  route: '/' | '/groups' | '/create' | '/profile';
  symbol: SymbolViewProps['name'];
  selectedSymbol: SymbolViewProps['name'];
};

const items: NavItem[] = [
  { key: 'home', label: 'Home', route: '/', symbol: { ios: 'house', android: 'home', web: 'home' }, selectedSymbol: { ios: 'house.fill', android: 'home', web: 'home' } },
  { key: 'groups', label: 'Groups', route: '/groups', symbol: { ios: 'person.2', android: 'groups', web: 'groups' }, selectedSymbol: { ios: 'person.2.fill', android: 'groups', web: 'groups' } },
  { key: 'create', label: 'Start', route: '/create', symbol: { ios: 'plus', android: 'add', web: 'add' }, selectedSymbol: { ios: 'plus', android: 'add', web: 'add' } },
  { key: 'profile', label: 'Profile', route: '/profile', symbol: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }, selectedSymbol: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' } },
];

export function AppShell({ children, activeRoute = 'none' }: PropsWithChildren<{ activeRoute?: RouteName }>) {
  const router = useRouter();
  return (
    <View style={styles.page}>
      <SafeAreaView edges={['top']} style={styles.shell}>
        <View style={styles.body}>{children}</View>
        {activeRoute !== 'none' && (
          <SafeAreaView edges={['bottom']} style={styles.navWrap}>
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
                      pressed && styles.pressed,
                    ]}>
                    {item.key === 'create' ? (
                      <View style={styles.createIcon}>
                        <SymbolView name={item.symbol} size={19} tintColor={colors.paper} />
                      </View>
                    ) : (
                      <SymbolView
                        name={selected ? item.selectedSymbol : item.symbol}
                        size={21}
                        tintColor={selected ? colors.greenDark : colors.muted}
                      />
                    )}
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
          </SafeAreaView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: Platform.OS === 'web' ? '#E9EFEA' : colors.canvas, flex: 1 },
  shell: {
    alignSelf: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    maxWidth: contentWidth,
    width: '100%',
  },
  body: { flex: 1 },
  navWrap: { backgroundColor: colors.paper, borderTopColor: colors.line, borderTopWidth: 1, paddingHorizontal: spacing.sm, paddingTop: spacing.xs },
  nav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 56,
  },
  navItem: { alignItems: 'center', gap: 2, justifyContent: 'center', minWidth: 58, paddingVertical: 4 },
  createIcon: { alignItems: 'center', backgroundColor: colors.clay, borderRadius: radius.full, height: 40, justifyContent: 'center', marginTop: -12, shadowColor: colors.clay, shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.22, shadowRadius: 8, width: 40 },
  navLabel: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  navLabelSelected: { color: colors.greenDark },
  createLabel: { color: colors.greenDark },
  pressed: { opacity: 0.76 },
});
