import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { Avatar, Button, SectionLabel, StatusPill } from '@/components/ui';
import { groupDecisions, groupMessages } from '@/data/mock';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';
import type { DecisionState } from '@/types';

const decisionTone: Record<DecisionState, 'green' | 'clay' | 'neutral'> = {
  Agreed: 'green',
  Discussing: 'clay',
  Suggested: 'neutral',
  'Not discussed': 'neutral',
};

export default function GroupRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { findIntent } = useKajora();
  const intent = findIntent(id);

  if (!intent) return null;

  return (
    <AppShell>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.product}>{intent.product} group</Text>
            <Text style={styles.groupMeta}>{intent.interestedCount} interested · {intent.area}</Text>
          </View>
          <Pressable><Text style={styles.more}>•••</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Planning, not payment</Text>
            <Text style={styles.bannerBody}>Interest is still non-binding. Confirm only after everyone reviews the final group plan.</Text>
          </View>

          <View style={styles.membersRow}>
            {['MA', 'TA', 'SA', 'KO'].map((initials) => <Avatar initials={initials} key={initials} size={34} />)}
            <Text style={styles.membersText}>{intent.interestedCount} people in this room</Text>
            <Text style={styles.invite}>Invite</Text>
          </View>

          <View style={styles.sectionHeader}>
            <SectionLabel>GROUP DECISIONS</SectionLabel>
            <Text style={styles.sectionAction}>View all</Text>
          </View>
          <View style={styles.decisionList}>
            {groupDecisions.map((decision) => (
              <View key={decision.label} style={styles.decision}>
                <View style={styles.decisionText}>
                  <Text style={styles.decisionLabel}>{decision.label}</Text>
                  <Text style={styles.decisionValue}>{decision.value}</Text>
                </View>
                <StatusPill label={decision.state} tone={decisionTone[decision.state]} />
              </View>
            ))}
          </View>

          <View style={styles.planCard}>
            <View style={styles.planTop}>
              <Text style={styles.planTitle}>Final group plan</Text>
              <StatusPill label="NOT READY" />
            </View>
            <Text style={styles.planBody}>Agree the supplier and final amount before preparing a plan for everyone to confirm.</Text>
            <Button disabled label="Prepare group plan" onPress={() => {}} variant="secondary" />
          </View>

          <SectionLabel>CONVERSATION</SectionLabel>
          <View style={styles.messages}>
            {groupMessages.map((message) => (
              <View key={message.id} style={[styles.messageRow, message.mine && styles.messageMine]}>
                {!message.mine && <Avatar initials={message.initials} size={30} />}
                <View style={[styles.message, message.mine && styles.messageBubbleMine]}>
                  {!message.mine && <Text style={styles.messageAuthor}>{message.author}</Text>}
                  <Text style={styles.messageBody}>{message.body}</Text>
                  <Text style={styles.messageTime}>{message.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.composer}>
          <TextInput placeholder="Write to the group" placeholderTextColor={colors.muted} style={styles.composerInput} />
          <Pressable style={styles.send}><Text style={styles.sendText}>Send</Text></Pressable>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  back: { alignItems: 'center', borderColor: colors.line, borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  backText: { color: colors.ink, fontSize: 21 },
  headerTitle: { flex: 1, marginLeft: spacing.md },
  product: { color: colors.ink, fontSize: type.body, fontWeight: '700' },
  groupMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  more: { color: colors.muted, fontSize: 18, letterSpacing: 2 },
  content: { paddingBottom: spacing.xl, paddingHorizontal: spacing.lg },
  banner: { backgroundColor: colors.sageSoft, borderRadius: radius.md, marginTop: spacing.md, padding: spacing.md },
  bannerTitle: { color: colors.greenDark, fontSize: type.small, fontWeight: '700' },
  bannerBody: { color: colors.muted, fontSize: type.small, lineHeight: 19, marginTop: 4 },
  membersRow: { alignItems: 'center', borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.md },
  membersText: { color: colors.muted, flex: 1, fontSize: type.small, marginLeft: spacing.md },
  invite: { color: colors.green, fontSize: type.small, fontWeight: '700' },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
  sectionAction: { color: colors.green, fontSize: type.small, fontWeight: '600' },
  decisionList: { borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.md, overflow: 'hidden' },
  decision: { alignItems: 'center', backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', padding: spacing.md },
  decisionText: { flex: 1 },
  decisionLabel: { color: colors.muted, fontSize: 11 },
  decisionValue: { color: colors.ink, fontSize: type.small, fontWeight: '600', marginTop: 4 },
  planCard: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, gap: spacing.md, marginVertical: spacing.lg, padding: spacing.md },
  planTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  planTitle: { color: colors.ink, fontSize: type.title, fontWeight: '700' },
  planBody: { color: colors.muted, fontSize: type.small, lineHeight: 20 },
  messages: { gap: spacing.md, marginTop: spacing.md },
  messageRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm },
  messageMine: { justifyContent: 'flex-end' },
  message: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, maxWidth: '86%', padding: spacing.md },
  messageBubbleMine: { backgroundColor: colors.sageSoft, borderColor: colors.sage },
  messageAuthor: { color: colors.greenDark, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  messageBody: { color: colors.ink, fontSize: type.small, lineHeight: 20 },
  messageTime: { alignSelf: 'flex-end', color: colors.muted, fontSize: 10, marginTop: 5 },
  composer: { alignItems: 'center', backgroundColor: colors.canvas, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  composerInput: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, flex: 1, minHeight: 42, paddingHorizontal: spacing.md },
  send: { backgroundColor: colors.green, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12 },
  sendText: { color: colors.paper, fontSize: type.small, fontWeight: '700' },
});
