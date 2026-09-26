import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { Avatar, StatusPill, Wordmark } from '@/components/ui';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';

export default function GroupsScreen() {
  const router = useRouter();
  const { interestedIds, intents } = useKajora();
  const groups = intents.filter((intent) => interestedIds.has(intent.id));

  return (
    <AppShell activeRoute="groups">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Wordmark compact />
        <Text style={styles.heading}>Your groups</Text>
        <Text style={styles.lede}>People you’re planning a purchase with. Nothing here is a payment commitment.</Text>

        <View style={styles.list}>
          {groups.map((group) => (
            <Pressable
              key={group.id}
              onPress={() => router.push({ pathname: '/groups/[id]', params: { id: group.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardTop}>
                <Avatar initials={group.creator.initials} />
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardTitle}>{group.product} group</Text>
                  <Text style={styles.cardMeta}>{group.area} · {group.interestedCount} interested</Text>
                </View>
                <StatusPill label={group.status.replace('-', ' ').toUpperCase()} tone="green" />
              </View>
              <Text numberOfLines={2} style={styles.cardBody}>{group.title}</Text>
              <View style={styles.progressTrack}><View style={[styles.progress, { width: group.status === 'planning' ? '55%' : '30%' }]} /></View>
              <View style={styles.cardFooter}>
                <Text style={styles.nextStep}>{group.status === 'planning' ? 'Next: agree supplier and final amount' : 'Next: gather more interested people'}</Text>
                <Text style={styles.arrow}>→</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {groups.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No active groups yet.</Text>
            <Text style={styles.emptyText}>Show interest in a public intention to begin planning with others.</Text>
            <Pressable onPress={() => router.navigate('/')}><Text style={styles.discover}>Discover intentions</Text></Pressable>
          </View>
        )}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  heading: { color: colors.ink, fontSize: 32, fontWeight: '700', letterSpacing: -0.7, marginTop: spacing.xl },
  lede: { color: colors.muted, fontSize: type.body, lineHeight: 23, marginTop: spacing.sm },
  list: { gap: spacing.md, marginTop: spacing.xl },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  pressed: { opacity: 0.8 },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  cardTitleWrap: { flex: 1, marginLeft: spacing.sm },
  cardTitle: { color: colors.ink, fontSize: type.body, fontWeight: '700' },
  cardMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  cardBody: { color: colors.ink, fontSize: type.title, fontWeight: '700', lineHeight: 26, marginTop: spacing.lg },
  progressTrack: { backgroundColor: colors.quiet, borderRadius: 3, height: 5, marginTop: spacing.lg, overflow: 'hidden' },
  progress: { backgroundColor: colors.green, height: '100%' },
  cardFooter: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  nextStep: { color: colors.muted, flex: 1, fontSize: type.small },
  arrow: { color: colors.green, fontSize: 20 },
  empty: { borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.xl, padding: spacing.xl },
  emptyTitle: { color: colors.ink, fontSize: type.title, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: type.body, lineHeight: 23, marginTop: spacing.sm },
  discover: { color: colors.green, fontSize: type.body, fontWeight: '700', marginTop: spacing.lg },
});
