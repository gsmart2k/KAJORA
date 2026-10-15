import { useActivity } from '@/state/activity-context';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';

export default function GroupsScreen() {
  const router = useRouter();
  const { error, findIntent, groups, isLoading, requestsByIntent } = useKajora();
  const { unread, newGroups } = useActivity();
  const groupItems = groups.flatMap((group) => {
    const intent = findIntent(group.sourcePostId);
    return intent ? [{ group, intent }] : [];
  });

  return (
    <AppShell activeRoute="groups">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Your groups</Text>
        <Text style={styles.lede}>Your shared purchases, all in one place.</Text>

        <View style={styles.list}>
          {Object.entries(requestsByIntent).filter(([, requests]) => requests.length > 0).map(([id, requests]) => (
            <Pressable key={id} accessibilityRole="button" style={styles.card}
              onPress={() => router.push({ pathname: '/intents/[id]', params: { id } })}>
              <Text style={styles.cardTitle}>{requests.length} pending join {requests.length === 1 ? 'request' : 'requests'}</Text>
              <Text style={styles.cardBody}>{findIntent(id)?.title ?? 'Your intention'}</Text>
              <Text style={styles.discover}>Review requests →</Text>
            </Pressable>
          ))}
          {groupItems.map(({ group, intent }) => (
            <Pressable
              key={group.id}
              accessibilityRole="button"
              accessibilityLabel={`${intent.title}, ${group.memberCount} members${(unread[group.id] ?? 0) > 0 ? `, ${unread[group.id]} unread messages` : ''}`}
              onPress={() => router.push({ pathname: '/groups/[id]', params: { id: group.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardTop}>
                <Text numberOfLines={1} style={styles.productLabel}>{intent.product}</Text>
                {(unread[group.id] ?? 0) > 0 ? (
                  <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unread[group.id]} new</Text></View>
                ) : newGroups.includes(group.id) ? <Text style={styles.newLabel}>Just joined</Text> : null}
              </View>
              <Text numberOfLines={2} style={styles.groupTitle}>{intent.title}</Text>
              <Text numberOfLines={1} style={styles.cardMeta}>{intent.area} · {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</Text>
              <View style={styles.cardFooter}>
                <View style={[styles.statusDot, (group.state === 'closed' || group.state === 'completed') && styles.inactiveDot]} />
                <Text style={styles.nextStep}>{group.state === 'completed' ? 'Completed' : group.state === 'closed' ? 'Cancelled' : group.state === 'confirmed' ? 'Plan confirmed' : group.state === 'awaiting-confirmation' ? 'Plan ready to review' : 'Planning together'}</Text>
                <Text style={styles.openLabel}>Open chat <Text style={styles.arrow}>›</Text></Text>
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
  heading: { color: colors.ink, fontSize: type.display, fontWeight: '700', letterSpacing: -0.55, marginTop: spacing.sm },
  lede: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm },
  list: { gap: spacing.md, marginTop: spacing.lg },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: 18, borderWidth: 1, padding: 18 },
  pressed: { opacity: 0.8 },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  productLabel: { color: colors.green, flex: 1, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginRight: spacing.sm },
  groupTitle: { color: colors.ink, fontSize: 17, fontWeight: '600', lineHeight: 24, marginTop: 10 },
  unreadBadge: { backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  unreadText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  newLabel: { color: colors.green, fontSize: 11, fontWeight: '600' },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.sageGreen, marginRight: 7 },
  inactiveDot: { backgroundColor: colors.muted },
  openLabel: { color: colors.green, fontSize: 11, fontWeight: '600', marginLeft: 10 },
  cardTitle: { color: colors.ink, fontSize: type.body, fontWeight: '700' },
  cardMeta: { color: colors.muted, fontSize: 12, marginTop: 7 },
  cardBody: { color: colors.ink, fontSize: type.title, fontWeight: '700', lineHeight: 23, marginTop: spacing.md },
  cardFooter: { alignItems: 'center', flexDirection: 'row', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  nextStep: { color: colors.muted, flex: 1, fontSize: 11 },
  arrow: { color: colors.green, fontSize: 20 },
  empty: { borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.xl, padding: spacing.xl },
  emptyTitle: { color: colors.ink, fontSize: type.title, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm },
  discover: { color: colors.green, fontSize: type.body, fontWeight: '700', marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: type.small, lineHeight: 19, marginTop: spacing.md },
});
