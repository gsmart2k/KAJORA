import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { JoinRequests } from '@/components/join-requests';
import { AppShell } from '@/components/app-shell';
import { Avatar, Button, SectionLabel, StatusPill, Wordmark } from '@/components/ui';
import { useAuth } from '@/state/auth-context';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';

export default function IntentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { error, expressInterest, findIntent, getGroupForIntent, interestedIds, refresh, withdrawInterest } = useKajora();
  const [loading, setLoading] = useState(false);
  const intent = findIntent(id);

  if (!intent) {
    return (
      <AppShell>
        <View style={styles.missing}>
          <Text style={styles.title}>This intention is no longer available.</Text>
          <Button label="Return home" onPress={() => router.replace('/')} />
        </View>
      </AppShell>
    );
  }

  const interested = interestedIds.has(intent.id);
  const isOwner = Boolean(intent.creatorId && intent.creatorId === session?.userId);
  const group = getGroupForIntent(intent.id);
  const pending = interested && !group;
  const available = intent.type === 'available-share';

  const handleInterest = async () => {
    if (group) {
      router.push({ pathname: '/groups/[id]', params: { id: group.id } });
      return;
    }
    setLoading(true);
    const groupId = await expressInterest(intent.id);
    setLoading(false);
    if (groupId) router.push({ pathname: '/groups/[id]', params: { id: groupId } });
  };

  return (
    <AppShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Wordmark compact />
          <Text style={styles.share}>Share</Text>
        </View>

        <View style={styles.postTypeRow}>
          <StatusPill label={available ? 'SHARE AVAILABLE' : 'BUYING INTENT'} tone={available ? 'clay' : 'green'} />
          <Text style={styles.created}>{intent.createdAgo}</Text>
        </View>

        <Text style={styles.title}>{intent.title}</Text>
        <Text style={styles.location}>{intent.area} · {intent.location}</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{available ? 'This share is already sourced.' : 'This is an intention, not a sale.'}</Text>
          <Text style={styles.noticeBody}>
            {available
              ? 'Confirm the seller, product condition and collection details before making any payment.'
              : 'The group will still decide the exact product, seller, final amount and how the portions will be shared.'}
          </Text>
        </View>

        <View style={styles.creatorCard}>
          <Avatar initials={intent.creator.initials} size={48} />
          <View style={styles.creatorBody}>
            <Text style={styles.creatorName}>Posted by {intent.creator.name}</Text>
            <Text style={styles.creatorMeta}>
              {intent.creator.phoneVerified ? 'Identity verified' : 'KAJORA account'} · {intent.creator.completedGroups} completed {intent.creator.completedGroups === 1 ? 'group' : 'groups'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>WHAT THEY HAVE IN MIND</SectionLabel>
          <View style={styles.factGrid}>
            <Fact label="Product" value={intent.product} />
            <Fact label="Total people including organiser" value={intent.desiredPeople ? String(intent.desiredPeople) : "Not decided yet"} />
            <Fact label={available ? 'Available' : 'Preferred share'} value={intent.desiredShare} />
            <Fact label="Timing" value={intent.timing} />
            <Fact label="Budget" value={intent.budget ?? 'Not discussed'} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>THEIR NOTE</SectionLabel>
          <Text style={styles.description}>{intent.description}</Text>
        </View>

        <View style={styles.interestCard}>
          <View>
            <Text style={styles.interestCount}>{intent.interestedCount} people interested</Text>
            <Text style={styles.interestHelp}>Interest is free and does not commit you to pay.</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            disabled={!group && (isOwner || pending || intent.joiningClosed)}
            label={group ? 'Open private group' : isOwner ? 'You started this plan' : pending ? 'Awaiting approval' : intent.joiningClosed ? 'Joining closed' : 'Request to join'}
            loading={loading}
            onPress={handleInterest}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.interestHelp}>Chat access requires organiser approval.</Text>
          <Button label="Refresh status" variant="secondary" onPress={refresh} />
          {isOwner ? <JoinRequests intent={intent} /> : null}
          {interested && !isOwner ? (
            <Button label={pending ? "Cancel request" : "Leave group"} onPress={() => void withdrawInterest(intent.id)} variant="secondary" />
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md },
  back: { alignItems: 'center', borderColor: colors.line, borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  backText: { color: colors.ink, fontSize: 21 },
  share: { color: colors.green, fontSize: type.small, fontWeight: '700' },
  postTypeRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  created: { color: colors.muted, fontSize: type.small },
  title: { color: colors.ink, fontSize: type.display, fontWeight: '700', letterSpacing: -0.55, lineHeight: 33, marginTop: spacing.md },
  location: { color: colors.muted, fontSize: type.body, marginTop: spacing.sm },
  notice: { backgroundColor: colors.sageSoft, borderRadius: radius.md, marginTop: spacing.lg, padding: spacing.md },
  noticeTitle: { color: colors.greenDark, fontSize: type.body, fontWeight: '700' },
  noticeBody: { color: colors.muted, fontSize: type.small, lineHeight: 20, marginTop: spacing.xs },
  creatorCard: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', paddingVertical: spacing.lg },
  creatorBody: { flex: 1, marginLeft: spacing.md },
  creatorName: { color: colors.ink, fontSize: type.body, fontWeight: '700' },
  creatorMeta: { color: colors.muted, fontSize: type.small, marginTop: 4 },
  section: { marginTop: spacing.lg },
  factGrid: { borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, overflow: 'hidden' },
  fact: { backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, minHeight: 76, padding: spacing.md, width: '50%' },
  factLabel: { color: colors.muted, fontSize: 11 },
  factValue: { color: colors.ink, fontSize: type.small, fontWeight: '700', lineHeight: 19, marginTop: 7 },
  description: { color: colors.ink, fontSize: type.body, lineHeight: 22, marginTop: spacing.md },
  interestCard: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, padding: spacing.md },
  interestCount: { color: colors.ink, fontSize: type.body, fontWeight: '700' },
  interestHelp: { color: colors.muted, fontSize: 11, marginTop: 4, maxWidth: 260 },
  avatarStack: { flexDirection: 'row' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  error: { color: colors.danger, fontSize: type.small, lineHeight: 19, textAlign: 'center' },
  missing: { gap: spacing.lg, padding: spacing.xl },
});
