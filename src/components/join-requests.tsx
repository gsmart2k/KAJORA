import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { fetchJoinRequests, reviewJoinRequest, setJoiningClosed } from '@/lib/supabase-rest';
import { useAuth } from '@/state/auth-context';
import { useKajora } from '@/state/kajora-context';
import { colors, spacing } from '@/theme';
import type { Intent } from '@/types';

export function JoinRequests({ intent }: { intent: Intent }) {
  const { supabaseSession } = useAuth();
  const { refresh } = useKajora();
  const [requests, setRequests] = useState<{ user_id: string; display_name: string }[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reload = useCallback(async () => {
    if (!supabaseSession) return;
    setError('');
    try { setRequests(await fetchJoinRequests(supabaseSession, intent.id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load requests'); }
  }, [supabaseSession, intent.id]);
  useEffect(() => { void reload(); }, [reload]);
  const act = async (action: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await action(); await refresh(); await reload(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Please try again'); }
    finally { setBusy(false); }
  };
  if (!supabaseSession) return null;
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={{ color: colors.ink, fontWeight: '700' }}>Join requests</Text>
      <Text>Only approved members can read and send group messages. New members can see earlier messages.</Text>
      <Button disabled={busy} label="Refresh requests" variant="secondary" onPress={reload} />
      {requests.length === 0 ? <Text>No pending requests.</Text> : null}
      {requests.map((person) => (
        <View key={person.user_id} style={{ gap: spacing.sm }}>
          <Text>{person.display_name}</Text>
          <Button disabled={busy || intent.joiningClosed} label={`Approve ${person.display_name}`}
            onPress={() => act(() => reviewJoinRequest(supabaseSession, intent.id, person.user_id, true))} />
          <Button disabled={busy} label={`Decline ${person.display_name}`} variant="secondary"
            onPress={() => act(() => reviewJoinRequest(supabaseSession, intent.id, person.user_id, false))} />
        </View>
      ))}
      <Button disabled={busy} label={intent.joiningClosed ? 'Reopen joining' : 'Close joining'} variant="secondary"
        onPress={() => act(() => setJoiningClosed(supabaseSession, intent.id, !intent.joiningClosed))} />
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
    </View>
  );
}
