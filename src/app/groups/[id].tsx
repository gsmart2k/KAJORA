import { ReportAction } from '@/components/report-action';
import { PaymentSafety } from '@/components/payment-safety';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useActivity } from '@/state/activity-context';
import { isAppVisible, useAutoRefresh } from '@/lib/use-auto-refresh';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatImage } from '@/components/chat-image';
import { ImageAttachment } from '@/components/image-attachment';
import { GroupPlanning } from '@/components/group-planning';
import { AppShell } from '@/components/app-shell';
import { Avatar } from '@/components/ui';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';
export default function GroupRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  const { markRead } = useActivity();
  const { error, findGroup, findIntent, loadGroupMessages, messagesByGroup, sendGroupMessage } = useKajora();
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [messagesWhenScrolledAway, setMessagesWhenScrolledAway] = useState(0);
  const nearBottom = useRef(true);
  const chat = useRef<ScrollView>(null);
  const group = findGroup(id);
  const intent = group ? findIntent(group.sourcePostId) : undefined;
  const messages = group ? messagesByGroup[group.id] ?? [] : [];
  const groupId = group?.id;
  useEffect(() => {
    if (groupId) void loadGroupMessages(groupId);
  }, [groupId, loadGroupMessages]);

  const markVisibleRead = useCallback(async () => {
    if (focused && !panelOpen && atBottom && groupId && isAppVisible()) markRead(groupId);
  }, [atBottom, focused, groupId, markRead, panelOpen]);
  useEffect(() => { void markVisibleRead(); }, [markVisibleRead]);
  useAutoRefresh(markVisibleRead, focused && Boolean(groupId));

  const latestMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (!focused || panelOpen || !nearBottom.current) return;
    const frame = requestAnimationFrame(() => chat.current?.scrollToEnd({ animated: false }));
    return () => cancelAnimationFrame(frame);
  }, [focused, latestMessageId, panelOpen]);

  if (!intent || !group) return null;

  const closed = ['completed', 'closed'].includes(group.state);
  const send = async () => {
    if (closed) return;
    if (!messageBody.trim()) return;
    setSending(true);
    const sendError = await sendGroupMessage(group.id, messageBody);
    setSending(false);
    if (!sendError) {
      setMessageBody('');
      nearBottom.current = true; setAtBottom(true);
      requestAnimationFrame(() => chat.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <AppShell>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>←</Text></Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.product}>{intent.product} group</Text>
            <Text style={styles.groupMeta}>{group.memberCount} members · {intent.area}</Text>
          </View>

        </View>

        <PaymentSafety compact />
        <GroupPlanning key={group.id} group={group} intent={intent} focused={focused} onPanelChange={setPanelOpen} />
        <ScrollView ref={chat} style={styles.chat} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" scrollEventThrottle={100}
          onScroll={({ nativeEvent }) => {
            const distance = nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - nativeEvent.contentOffset.y;
            const next = distance < 100;
            if (nearBottom.current && !next) setMessagesWhenScrolledAway(messages.length);
            nearBottom.current = next; setAtBottom(next);
          }}
          onLayout={() => { if (nearBottom.current && !panelOpen) chat.current?.scrollToEnd({ animated: false }); }}
          onContentSizeChange={() => { if (nearBottom.current && focused && !panelOpen) chat.current?.scrollToEnd({ animated: false }); }}>
          {messages.length === 0 ? <View style={styles.empty}>
            <Text style={styles.product}>Start the conversation</Text>
            <Text style={styles.bannerBody}>Discuss the product, share a photo or ask the group a question. Plans and polls are just above.</Text>
          </View> : null}
          <View style={styles.messages}>
            {messages.map((message) => {
              const isOrganiser = Boolean(intent.creatorId && message.authorId === intent.creatorId);
              return (
              <View key={message.id} style={[styles.messageRow, message.mine && styles.messageMine]}>
                {!message.mine && <Avatar initials={message.initials} size={30} />}
                <View style={[styles.message, message.mine && styles.messageBubbleMine]}>
                  {(!message.mine || isOrganiser) && (
                    <View style={styles.messageHeading}>
                      <Text style={styles.messageAuthor}>{message.author}</Text>
                      {isOrganiser && <Text style={styles.organiserBadge}>Organiser</Text>}
                    </View>
                  )}
                  {message.imagePath ? <ChatImage path={message.imagePath} focused={focused} /> : null}
                  {message.body ? <Text style={styles.messageBody}>{message.body}</Text> : null}
                  <Text style={styles.messageTime}>{message.time}</Text>
                  {!message.mine ? <ReportAction kind="message" target={message.id} label="Report message" /> : null}
                </View>
              </View>
              );
            })}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        {!atBottom ? <Pressable accessibilityRole="button" style={styles.jump} onPress={() => {
          nearBottom.current = true; setAtBottom(true);
          chat.current?.scrollToEnd({ animated: true });
        }}><Text style={styles.jumpText}>{messages.length > messagesWhenScrolledAway ? 'New messages ↓' : 'Jump to latest ↓'}</Text></Pressable> : null}
        <SafeAreaView edges={['bottom']}>
        {closed ? <Text style={styles.closedNote}>This purchase is closed. The conversation is read-only.</Text> : <View style={styles.composer}>
          <ImageAttachment key={group.id} groupId={group.id} />
          <TextInput
            onChangeText={setMessageBody}
            onSubmitEditing={() => void send()}
            placeholder="Write to the group"
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.composerInput}
            value={messageBody}
          />
          <Pressable disabled={sending || !messageBody.trim()} onPress={() => void send()} style={[styles.send, (sending || !messageBody.trim()) && styles.sendDisabled]}>
            <Text style={styles.sendText}>{sending ? '…' : 'Send'}</Text>
          </Pressable>
        </View>}
        </SafeAreaView>
      </KeyboardAvoidingView>
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
  chat: { flex: 1 },
  content: { paddingBottom: spacing.md, paddingHorizontal: spacing.md, flexGrow: 1 },
  empty: { padding: spacing.lg, marginTop: spacing.xl },
  jump: { alignSelf: 'center', backgroundColor: colors.sageSoft, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: 10, marginVertical: spacing.xs },
  jumpText: { color: colors.greenDark, fontSize: 12, fontWeight: '700' },
  closedNote: { color: colors.muted, fontSize: 12, lineHeight: 18, padding: spacing.md },
  banner: { backgroundColor: colors.sageSoft, borderRadius: radius.md, marginTop: spacing.md, padding: spacing.md },
  bannerTitle: { color: colors.greenDark, fontSize: type.small, fontWeight: '700' },
  bannerBody: { color: colors.muted, fontSize: type.small, lineHeight: 19, marginTop: 4 },
  messages: { gap: spacing.md, marginTop: spacing.md },
  messageRow: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm },
  messageMine: { justifyContent: 'flex-end' },
  message: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, maxWidth: '86%', padding: spacing.md },
  messageBubbleMine: { backgroundColor: colors.sageSoft, borderColor: colors.sage },
  messageHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  messageAuthor: { color: colors.greenDark, flexShrink: 1, fontSize: 11, fontWeight: '700' },
  organiserBadge: { backgroundColor: colors.greenDark, borderRadius: radius.sm, color: colors.paper, fontSize: 10, fontWeight: '600', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3 },
  messageBody: { color: colors.ink, fontSize: type.small, lineHeight: 20 },
  messageTime: { alignSelf: 'flex-end', color: colors.muted, fontSize: 10, marginTop: 5 },
  composer: { alignItems: 'center', backgroundColor: colors.canvas, borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  composerInput: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, flex: 1, minHeight: 42, paddingHorizontal: spacing.md },
  send: { backgroundColor: colors.green, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12 },
  sendText: { color: colors.paper, fontSize: type.small, fontWeight: '700' },
  sendDisabled: { opacity: 0.45 },
  error: { color: colors.danger, fontSize: type.small, lineHeight: 19, marginTop: spacing.md },
});
