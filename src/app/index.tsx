import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppShell } from '@/components/app-shell';
import { IntentCard } from '@/components/intent-card';
import { Wordmark } from '@/components/ui';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';

const categories = [
  { icon: '✦', label: 'All' },
  { icon: '🐄', label: 'Livestock' },
  { icon: '🌾', label: 'Foodstuff' },
  { icon: '🧺', label: 'Household' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { intents } = useKajora();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const visibleIntents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return intents.filter((intent) => {
      const matchesCategory = category === 'All' || intent.category === category;
      const matchesQuery =
        !normalized ||
        intent.title.toLowerCase().includes(normalized) ||
        intent.location.toLowerCase().includes(normalized) ||
        intent.product.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, intents, query]);

  return (
    <AppShell activeRoute="home">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Wordmark compact />
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" style={styles.locationButton}>
              <Text style={styles.locationPin}>●</Text>
              <Text style={styles.locationText}>Osogbo</Text>
              <Text style={styles.chevron}>⌄</Text>
            </Pressable>
            <Pressable accessibilityLabel="Notifications" accessibilityRole="button" style={styles.notificationButton}>
              <Text style={styles.bell}>♢</Text>
              <View style={styles.alertDot} />
            </Pressable>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>BUY SMARTER, TOGETHER</Text>
            <Text style={styles.heroTitle}>Share the cost.{`\n`}Keep what you need.</Text>
            <Text style={styles.heroBody}>Find nearby people ready to split a bulk purchase with you.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/create')} style={styles.heroAction}>
              <Text style={styles.heroActionText}>Start a buying plan</Text>
              <Text style={styles.heroActionArrow}>→</Text>
            </Pressable>
          </View>
          <View accessible accessibilityLabel="People sharing a bulk purchase" style={styles.heroArt}>
            <View style={styles.sun} />
            <View style={styles.bagBack}><Text style={styles.bagEmoji}>🌾</Text></View>
            <View style={styles.bagFront}><Text style={styles.bagEmoji}>🐄</Text></View>
            <View style={styles.personLeft}><Text style={styles.personText}>AO</Text></View>
            <View style={styles.personRight}><Text style={styles.personText}>MA</Text></View>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchMark}>⌕</Text>
          <TextInput
            accessibilityLabel="Search buying intentions"
            onChangeText={setQuery}
            placeholder="What do you want to share?"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={query}
          />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Browse categories</Text>
          <Text style={styles.sectionAction}>Near you</Text>
        </View>
        <ScrollView horizontal contentContainerStyle={styles.categories} showsHorizontalScrollIndicator={false}>
          {categories.map((item) => {
            const selected = category === item.label;
            return (
              <Pressable
                accessibilityRole="button"
                key={item.label}
                onPress={() => setCategory(item.label)}
                style={[styles.category, selected && styles.categorySelected]}>
                <View style={[styles.categoryIcon, selected && styles.categoryIconSelected]}>
                  <Text style={styles.categoryEmoji}>{item.icon}</Text>
                </View>
                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Open buying plans</Text>
          <Text style={styles.sectionCount}>{visibleIntents.length} nearby</Text>
        </View>

        <View style={styles.cards}>
          {visibleIntents.map((intent) => (
            <IntentCard
              intent={intent}
              key={intent.id}
              onPress={() => router.push({ pathname: '/intents/[id]', params: { id: intent.id } })}
            />
          ))}
        </View>

        {visibleIntents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.emptyTitle}>Nothing matching that yet.</Text>
            <Text style={styles.emptyBody}>Be the first to start a buying plan nearby.</Text>
            <Pressable onPress={() => router.push('/create')} style={styles.emptyAction}>
              <Text style={styles.emptyActionText}>Start a plan</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  locationButton: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.full, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  locationPin: { color: colors.clay, fontSize: 8 },
  locationText: { color: colors.ink, fontSize: type.small, fontWeight: '700' },
  chevron: { color: colors.muted, fontSize: type.small },
  notificationButton: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.full, height: 36, justifyContent: 'center', width: 36 },
  bell: { color: colors.greenDark, fontSize: 20, transform: [{ rotate: '45deg' }] },
  alertDot: { backgroundColor: colors.clay, borderColor: colors.paper, borderRadius: 5, borderWidth: 2, height: 9, position: 'absolute', right: 6, top: 5, width: 9 },
  hero: { backgroundColor: colors.greenDark, borderRadius: radius.xl, flexDirection: 'row', marginTop: spacing.lg, minHeight: 228, overflow: 'hidden', padding: spacing.lg },
  heroCopy: { flex: 1, zIndex: 2 },
  eyebrow: { color: '#A9D2BC', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  heroTitle: { color: colors.white, fontSize: 25, fontWeight: '800', letterSpacing: -0.6, lineHeight: 30, marginTop: spacing.sm },
  heroBody: { color: '#D6E6DC', fontSize: type.small, lineHeight: 18, marginTop: spacing.sm, maxWidth: 235 },
  heroAction: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.clay, borderRadius: radius.full, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 10 },
  heroActionText: { color: colors.white, fontSize: type.small, fontWeight: '800' },
  heroActionArrow: { color: colors.white, fontSize: 16 },
  heroArt: { bottom: 0, height: 190, position: 'absolute', right: -4, width: 150 },
  sun: { backgroundColor: colors.ochre, borderRadius: 18, height: 36, opacity: 0.9, position: 'absolute', right: 14, top: 12, width: 36 },
  bagBack: { alignItems: 'center', backgroundColor: colors.sage, borderRadius: 24, height: 90, justifyContent: 'center', position: 'absolute', right: 8, top: 70, transform: [{ rotate: '8deg' }], width: 76 },
  bagFront: { alignItems: 'center', backgroundColor: colors.claySoft, borderRadius: 24, height: 94, justifyContent: 'center', position: 'absolute', right: 62, top: 80, transform: [{ rotate: '-7deg' }], width: 78 },
  bagEmoji: { fontSize: 32 },
  personLeft: { alignItems: 'center', backgroundColor: colors.clay, borderColor: colors.greenDark, borderRadius: 18, borderWidth: 3, bottom: 3, height: 36, justifyContent: 'center', position: 'absolute', right: 90, width: 36 },
  personRight: { alignItems: 'center', backgroundColor: colors.ochre, borderColor: colors.greenDark, borderRadius: 18, borderWidth: 3, bottom: 5, height: 36, justifyContent: 'center', position: 'absolute', right: 58, width: 36 },
  personText: { color: colors.white, fontSize: 9, fontWeight: '900' },
  searchBox: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.lg, flexDirection: 'row', marginTop: spacing.md, paddingHorizontal: spacing.md, shadowColor: colors.greenDark, shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.04, shadowRadius: 12 },
  searchMark: { color: colors.green, fontSize: 21, marginRight: spacing.sm },
  searchInput: { color: colors.ink, flex: 1, fontSize: type.body, paddingVertical: 14 },
  sectionRow: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  sectionTitle: { color: colors.ink, fontSize: type.title, fontWeight: '800', letterSpacing: -0.2 },
  sectionAction: { color: colors.green, fontSize: type.small, fontWeight: '700' },
  sectionCount: { color: colors.muted, fontSize: type.small },
  categories: { gap: spacing.sm, paddingVertical: spacing.md },
  category: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.md, minWidth: 82, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  categorySelected: { backgroundColor: colors.green },
  categoryIcon: { alignItems: 'center', backgroundColor: colors.canvas, borderRadius: 14, height: 40, justifyContent: 'center', width: 40 },
  categoryIconSelected: { backgroundColor: 'rgba(255,255,255,0.16)' },
  categoryEmoji: { fontSize: 18 },
  categoryText: { color: colors.muted, fontSize: 10, fontWeight: '700', marginTop: spacing.xs },
  categoryTextSelected: { color: colors.white },
  cards: { gap: spacing.md, marginTop: spacing.md },
  emptyState: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: radius.lg, marginTop: spacing.md, padding: spacing.xl },
  emptyIcon: { fontSize: 30 },
  emptyTitle: { color: colors.ink, fontSize: type.title, fontWeight: '700', marginTop: spacing.sm },
  emptyBody: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.xs, textAlign: 'center' },
  emptyAction: { backgroundColor: colors.sageSoft, borderRadius: radius.full, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  emptyActionText: { color: colors.green, fontSize: type.small, fontWeight: '800' },
});
