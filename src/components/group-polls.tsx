import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, SectionLabel } from '@/components/ui';
import { useAuth } from '@/state/auth-context';
import type { GroupPoll } from '@/lib/supabase-rest';
import { colors, radius, spacing, type } from '@/theme';

type Props = {
  polls: GroupPoll[]; members: { user_id: string; name: string }[]; groupId: string; owner: boolean; closed: boolean; busy: boolean;
  act: (action: string, params: Record<string, unknown>) => Promise<boolean>;
};
export function GroupPolls({ polls, members, groupId, owner, closed, busy, act }: Props) {
  const { session } = useAuth();
  const [creating, setCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const create = async () => {
    const choices = options.map((value) => value.trim());
    if (question.trim().length < 3 || choices.some((value) => !value) || new Set(choices.map((value) => value.toLowerCase())).size !== choices.length) {
      setError('Enter a question and at least two different, non-empty options.'); return;
    }
    if (await act('create_group_poll', { target_group: groupId, question_text: question, choices })) {
      setCreating(false); setQuestion(''); setOptions(['', '']); setError('');
    }
  };
  return <View style={styles.stack}>
    <SectionLabel>GROUP POLLS</SectionLabel>
    <Text style={styles.body}>One vote per member. Votes are visible to the group and can change until the poll closes. A poll does not confirm the purchase plan.</Text>
    {!closed ? <Button disabled={busy} variant="secondary" label={creating ? 'Cancel new poll' : 'Create a poll'} onPress={() => setCreating(!creating)} /> : null}
    {creating && !closed ? <View style={styles.card}>
      <TextInput accessibilityLabel="Poll question" style={styles.input} maxLength={180} placeholder="What should the group decide?" placeholderTextColor={colors.muted} value={question} onChangeText={setQuestion} editable={!busy} />
      {options.map((option, index) => <View key={index} style={styles.stack}>
        <TextInput accessibilityLabel={`Option ${index + 1}`} style={styles.input} maxLength={100} placeholder={`Option ${index + 1}`} placeholderTextColor={colors.muted} value={option} editable={!busy}
          onChangeText={(value) => setOptions(options.map((old, i) => i === index ? value : old))} />
        {options.length > 2 ? <Button disabled={busy} variant="quiet" label={`Remove option ${index + 1}`} onPress={() => setOptions(options.filter((_, i) => i !== index))} /> : null}
      </View>)}
      {options.length < 6 ? <Button disabled={busy} variant="quiet" label="Add option" onPress={() => setOptions([...options, ''])} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button loading={busy} label="Publish poll" onPress={() => void create()} />
    </View> : null}
    {polls.length === 0 ? <Text style={styles.body}>No polls yet. Ask the group about suppliers, dates or portions.</Text> : null}
    {polls.map((poll) => {
      const choice = poll.votes.find((vote) => vote.user_id === session?.userId)?.choice;
      return <View key={poll.id} style={styles.card}>
        <Text style={styles.title}>{poll.question}</Text>
        <Text style={styles.body}>{members.find((member) => member.user_id === poll.creator_id)?.name ?? 'Former member'} · {poll.closed ? 'Closed' : 'Open'} · {poll.votes.length} votes</Text>
        {poll.options.map((option, index) => {
          const votes = poll.votes.filter((vote) => vote.choice === index);
          return <View key={index} style={styles.stack}>
            <Button disabled={busy || poll.closed || closed} variant={choice === index ? 'primary' : 'secondary'}
              label={`${choice === index ? '✓ ' : ''}${option} · ${votes.length}`}
              onPress={() => void act('vote_group_poll', { target_poll: poll.id, option_index: index })} />
            {votes.length > 0 ? <Text style={styles.body}>{votes.map((vote) => members.find((member) => member.user_id === vote.user_id)?.name ?? 'Former member').join(', ')}</Text> : null}
          </View>;
        })}
        {!poll.closed && !closed && (owner || poll.creator_id === session?.userId) ? <Button disabled={busy} variant="quiet" label="Close voting" onPress={() => void act('close_group_poll', { target_poll: poll.id })} /> : null}
      </View>;
    })}
  </View>;
}
const styles = StyleSheet.create({
  stack: { gap: spacing.sm },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  title: { color: colors.ink, fontSize: type.title, fontWeight: '700' },
  body: { color: colors.muted, fontSize: type.small, lineHeight: 20 },
  input: { color: colors.ink, borderColor: colors.line, borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, minHeight: 44, fontSize: type.small },
  error: { color: colors.danger, fontSize: type.small },
});
