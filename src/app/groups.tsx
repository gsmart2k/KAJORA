import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { Avatar, StatusPill, Wordmark } from '@/components/ui';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';

export default function GroupsScreen() {
  const router = useRouter();
  const { error, findIntent, groups, isLoading } = useKajora();
  const groupItems = groups.flatMap((group) => {
    const intent = findIntent(group.sourcePostId);
    return intent ? [{ group, intent }] : [];
  });

  return (
    <AppShell activeRoute="groups">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Wordmark compact />
        <Text style={styles.heading}>Your groups</Text>
        <Text style={styles.lede}>People you’re planning a purchase with. Nothing here is a payment commitment.</Text>

        <View style={styles.list}>
          {groupItems.map(({ group, intent }) => (
            <Pressable
              key={group.id}
              onPress={() => router.push({ pathname: '/groups/[id]', params: { id: group.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardTop}>
                <Avatar initials={intent.creator.initials} />
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardTitle}>{intent.product} group</Text>
                  <Text style={styles.cardMeta}>{intent.area} · {group.memberCount} members</Text>
                </View>
                <StatusPill label={group.state.replace('-', ' ').toUpperCase()} tone="green" />
              </View>
              <Text numberOfLines={2} style={styles.cardBody}>{intent.title}</Text>
              <View style={styles.progressTrack}><View style={[styles.progress, { width: group.state === 'planning' ? '55%' : '30%' }]} /></View>
              <View style={styles.cardFooter}>
                <Text style={styles.nextStep}>{group.state === 'planning' ? 'Next: agree supplier and final amount' : 'Next: gather more interested people'}</Text>
                <Text style={styles.arrow}>→</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {groupItems.length === 0 && !isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No active groups yet.</Text>
            <Text style={styles.emptyText}>Show interest in a public intention to begin planning with others.</Text>
            <Pressable onPress={() => router.navigate('/')}><Text style={styles.discover}>Discover intentions</Text></Pressable>
          </View>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  heading: { color: colors.ink, fontSize: type.display, fontWeight: '700', letterSpacing: -0.55, marginTop: spacing.lg },
  lede: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm },
  list: { gap: spacing.md, marginTop: spacing.lg },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, padding: spacing.md },
  pressed: { opacity: 0.8 },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  cardTitleWrap: { flex: 1, marginLeft: spacing.sm },
  cardTitle: { color: colors.ink, fontSize: type.body, fontWeight: '700' },
  cardMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  cardBody: { color: colors.ink, fontSize: type.title, fontWeight: '700', lineHeight: 23, marginTop: spacing.md },
  progressTrack: { backgroundColor: colors.quiet, borderRadius: 3, height: 5, marginTop: spacing.md, overflow: 'hidden' },
  progress: { backgroundColor: colors.green, height: '100%' },
  cardFooter: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  nextStep: { color: colors.muted, flex: 1, fontSize: type.small },
  arrow: { color: colors.green, fontSize: 20 },
  empty: { borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.xl, padding: spacing.xl },
  emptyTitle: { color: colors.ink, fontSize: type.title, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm },
  discover: { color: colors.green, fontSize: type.body, fontWeight: '700', marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: type.small, lineHeight: 19, marginTop: spacing.md },
});
