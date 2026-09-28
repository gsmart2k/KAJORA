import type { PropsWithChildren } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, contentWidth, radius, spacing } from '@/theme';

type RouteName = 'home' | 'groups' | 'create' | 'profile' | 'none';

type NavItem = {
  key: Exclude<RouteName, 'none' | 'create'>;
  label: string;
  route: '/' | '/groups' | '/profile';
  symbol: SymbolViewProps['name'];
  selectedSymbol: SymbolViewProps['name'];
};

const items: NavItem[] = [
  { key: 'home', label: 'Home', route: '/', symbol: { ios: 'house', android: 'home', web: 'home' }, selectedSymbol: { ios: 'house.fill', android: 'home', web: 'home' } },
  { key: 'groups', label: 'Groups', route: '/groups', symbol: { ios: 'person.2', android: 'groups', web: 'groups' }, selectedSymbol: { ios: 'person.2.fill', android: 'groups', web: 'groups' } },
  { key: 'profile', label: 'Profile', route: '/profile', symbol: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }, selectedSymbol: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' } },
];

const addSymbol: SymbolViewProps['name'] = { ios: 'plus', android: 'add', web: 'add' };

export function AppShell({ children, activeRoute = 'none' }: PropsWithChildren<{ activeRoute?: RouteName }>) {
  const router = useRouter();
  return (
    <View style={styles.page}>
      <SafeAreaView edges={['top']} style={styles.shell}>
        <View style={styles.body}>{children}</View>
        {activeRoute !== 'none' && (
          <SafeAreaView edges={['bottom']} style={styles.navWrap}>
            <Pressable
              accessibilityLabel="Start a buying plan"
              accessibilityRole="button"
              accessibilityState={{ selected: activeRoute === 'create' }}
              onPress={() => router.navigate('/create')}
              style={({ pressed }) => [
                styles.floatingAction,
                activeRoute === 'create' && styles.floatingActionSelected,
                pressed && styles.floatingActionPressed,
              ]}>
              <SymbolView name={addSymbol} size={25} tintColor={colors.white} />
              <Text style={styles.floatingActionLabel}>Start</Text>
            </Pressable>
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
                      selected && styles.navItemSelected,
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.navIcon, selected && styles.navIconSelected]}>
                      <SymbolView
                        name={selected ? item.selectedSymbol : item.symbol}
                        size={22}
                        tintColor={selected ? colors.green : colors.muted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.navLabel,
                        selected && styles.navLabelSelected,
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
  navWrap: { backgroundColor: colors.canvas, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  nav: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    elevation: 7,
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.greenDark,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  navItem: { alignItems: 'center', borderRadius: radius.md, flex: 1, gap: 2, justifyContent: 'center', minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  navItemSelected: { backgroundColor: colors.sageSoft },
  navIcon: { alignItems: 'center', borderRadius: radius.full, height: 30, justifyContent: 'center', width: 38 },
  navIconSelected: { backgroundColor: colors.sage },
  navLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.1 },
  navLabelSelected: { color: colors.greenDark, fontWeight: '800' },
  floatingAction: {
    alignItems: 'center',
    backgroundColor: colors.clay,
    borderColor: colors.canvas,
    borderRadius: radius.full,
    borderWidth: 5,
    elevation: 12,
    height: 68,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
    shadowColor: colors.clay,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    top: -72,
    width: 68,
    zIndex: 10,
  },
  floatingActionSelected: { backgroundColor: colors.greenDark },
  floatingActionPressed: { opacity: 0.86, transform: [{ scale: 0.96 }] },
  floatingActionLabel: { color: colors.white, fontSize: 9, fontWeight: '800', marginTop: -1 },
  pressed: { opacity: 0.76 },
});
