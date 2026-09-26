import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppShell } from '@/components/app-shell';
import { IntentCard } from '@/components/intent-card';
import { Wordmark } from '@/components/ui';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';

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
          <Wordmark />
          <Pressable accessibilityRole="button" style={styles.alertButton}>
            <View style={styles.alertDot} />
            <Text style={styles.alertText}>Alerts</Text>
          </Pressable>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.locationMark} />
          <Text style={styles.locationText}>Osogbo, Osun State</Text>
          <Text style={styles.locationChange}>Change</Text>
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>NEAR YOU</Text>
          <Text style={styles.heading}>What are people sharing?</Text>
          <Text style={styles.subheading}>Join an open plan or start one of your own.</Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchMark}>⌕</Text>
          <TextInput
            accessibilityLabel="Search buying intentions"
            onChangeText={setQuery}
            placeholder="Search cow, rice, oil..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={query}
          />
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.filters}
          showsHorizontalScrollIndicator={false}>
          {['All', 'Livestock', 'Foodstuff', 'Household'].map((item) => {
            const selected = category === item;
            return (
              <Pressable
                accessibilityRole="button"
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.filter, selected && styles.filterSelected]}>
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{item}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Open intentions</Text>
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

        {visibleIntents.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Nothing matching that yet.</Text>
            <Text style={styles.emptyBody}>Post your intention and let nearby people find you.</Text>
            <Pressable onPress={() => router.push('/create')} style={styles.emptyAction}>
              <Text style={styles.emptyActionText}>Post an intention</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  alertButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  alertDot: { backgroundColor: colors.clay, borderRadius: 4, height: 7, width: 7 },
  alertText: { color: colors.ink, fontSize: type.caption, fontWeight: '600' },
  locationRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  locationMark: {
    backgroundColor: colors.green,
    borderRadius: 5,
    height: 10,
    marginRight: spacing.sm,
    width: 10,
  },
  locationText: { color: colors.ink, fontSize: type.body, fontWeight: '600' },
  locationChange: { color: colors.green, fontSize: type.small, marginLeft: 'auto' },
  intro: { marginTop: spacing.lg },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heading: {
    color: colors.ink,
    fontSize: type.display,
    fontWeight: '700',
    letterSpacing: -0.55,
    lineHeight: 33,
    marginTop: spacing.xs,
    maxWidth: 430,
  },
  subheading: {
    color: colors.muted,
    fontSize: type.body,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 520,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  searchMark: { color: colors.green, fontSize: 20, marginRight: spacing.sm },
  searchInput: { color: colors.ink, flex: 1, fontSize: type.body, paddingVertical: 12 },
  filters: { gap: spacing.sm, paddingVertical: spacing.md },
  filter: {
    borderColor: colors.line,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  filterSelected: { backgroundColor: colors.green, borderColor: colors.green },
  filterText: { color: colors.muted, fontSize: type.small, fontWeight: '600' },
  filterTextSelected: { color: colors.paper },
  sectionRow: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, fontSize: type.title, fontWeight: '700' },
  sectionCount: { color: colors.muted, fontSize: type.small },
  cards: { gap: spacing.md, marginTop: spacing.md },
  emptyState: {
    alignItems: 'flex-start',
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  emptyTitle: { color: colors.ink, fontSize: type.title, fontWeight: '700' },
  emptyBody: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm },
  emptyAction: { marginTop: spacing.lg },
  emptyActionText: { color: colors.green, fontSize: type.body, fontWeight: '700' },
});
