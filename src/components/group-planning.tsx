import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, SectionLabel, StatusPill } from '@/components/ui';
import { GroupPolls } from '@/components/group-polls';
import { fetchGroupWorkspace, planningAction, type GroupWorkspace, type PlanDetails } from '@/lib/supabase-rest';
import { useAutoRefresh } from '@/lib/use-auto-refresh';
import { useAuth } from '@/state/auth-context';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';
import type { BuyingGroup, Intent } from '@/types';

const fields: { key: keyof PlanDetails; label: string; hint: string }[] = [
  { key: 'product', label: 'Product and quantity', hint: 'One cow, agreed size and condition' },
  { key: 'supplier', label: 'Supplier', hint: 'Name and collection/contact details' },
  { key: 'total', label: 'Total cost (₦)', hint: 'Include transport and other agreed costs' },
  { key: 'allocation', label: 'Each person’s share and cost', hint: 'List each member, their portion and amount in naira' },
  { key: 'pickup', label: 'Pickup location', hint: 'Where everyone will collect their share' },
  { key: 'date', label: 'Pickup date and time', hint: 'For example: 24 October 2026, 10am' },
];

export function GroupPlanning({ group, intent, focused }: { group: BuyingGroup; intent: Intent; focused: boolean }) {
  const { session, supabaseSession } = useAuth();
  const { refresh } = useKajora();
  const [workspace, setWorkspace] = useState<GroupWorkspace | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<PlanDetails | null>(null);
  const [editingVersion, setEditingVersion] = useState(0);
  const [note, setNote] = useState('');
  const [askingChange, setAskingChange] = useState(false);
  const [closing, setClosing] = useState<'completed' | 'closed' | null>(null);
  const generation = useRef(0);
  const plan = workspace?.plan;
  const owner = session?.userId === intent.creatorId;
  const closed = ['completed', 'closed'].includes(group.state);
  const current = Boolean(plan && ['awaiting_confirmation', 'confirmed'].includes(plan.state));
  const reload = useCallback(async () => {
    if (!supabaseSession) return;
    const requestGeneration = ++generation.current;
    try {
      const next = await fetchGroupWorkspace(supabaseSession, group.id);
      if (requestGeneration === generation.current) { setWorkspace(next); setError(''); }
    } catch (e) {
      if (requestGeneration === generation.current) setError(e instanceof Error ? e.message : 'Could not update this group');
    }
  }, [group.id, supabaseSession]);
  useEffect(() => {
    if (!supabaseSession) return;
    const requestGeneration = ++generation.current;
    void fetchGroupWorkspace(supabaseSession, group.id).then((next) => {
      if (requestGeneration === generation.current) { setWorkspace(next); setError(''); }
    }).catch((e: unknown) => {
      if (requestGeneration === generation.current) setError(e instanceof Error ? e.message : 'Could not load this group');
    });
    return () => { generation.current += 1; };
  }, [group.id, supabaseSession]);
  useAutoRefresh(reload, focused && !busy);

  const act = async (action: string, params: Record<string, unknown>): Promise<boolean> => {
    if (!supabaseSession || busy) return false;
    setBusy(true); setError(''); generation.current += 1;
    try {
      await planningAction(supabaseSession, action, params);
      await Promise.all([reload(), refresh()]);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again');
      return false;
    } finally { setBusy(false); }
  };
  const edit = () => {
    setEditingVersion(plan?.version ?? 0);
    setDraft({
      product: plan?.product_specification ?? intent.product,
      supplier: plan?.vendor_details.supplier ?? '', total: plan ? String(plan.cost_breakdown.total ?? '') : '',
      allocation: plan?.allocation_breakdown.description ?? '', pickup: plan?.fulfilment.pickup ?? '', date: plan?.schedule.date ?? '',
    });
  };
  const publish = async () => {
    if (!draft) return;
    if (Object.values(draft).some((value) => !value.trim()) || !/^\d{1,10}(\.\d{1,2})?$/.test(draft.total) || Number(draft.total) <= 0) {
      setError('Complete every field and enter a positive total, without commas.'); return;
    }
    if (await act('propose_group_plan', { target_group: group.id, expected_version: editingVersion, details: draft })) setDraft(null);
  };
  const response = plan?.responses.find((item) => item.user_id === session?.userId);

  return (
    <View style={styles.stack}>
      <SectionLabel>GROUP PLAN</SectionLabel>
      <View style={styles.card}>
        <Text style={styles.title}>{closed ? (group.state === 'completed' ? 'Purchase completed' : 'Purchase cancelled') : 'Agree the details together'}</Text>
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        {!workspace ? <><Text style={styles.body}>{error ? 'Planning could not load. Check that the latest database migration has been run.' : 'Loading the group plan…'}</Text><Button label="Retry" variant="secondary" onPress={() => void reload()} /></> : null}
        {plan ? <>
          <StatusPill label={`VERSION ${plan.version} · ${plan.state.replaceAll('_', ' ').toUpperCase()}`} tone={plan.state === 'confirmed' ? 'green' : 'neutral'} />
          {plan.state === 'superseded' ? <Text style={styles.body}>Membership changed. The organiser needs to publish an updated plan for fresh confirmation.</Text> : null}
          {[
            ['Product', plan.product_specification], ['Supplier', plan.vendor_details.supplier],
            ['Total', `₦${Number(plan.cost_breakdown.total).toLocaleString('en-NG')}`],
            ['Shares and costs', plan.allocation_breakdown.description], ['Pickup', plan.fulfilment.pickup], ['When', plan.schedule.date],
          ].map(([label, value]) => <View key={label}><Text style={styles.label}>{label}</Text><Text style={styles.body}>{value}</Text></View>)}
          <Text style={styles.label}>Member responses · version {plan.version}</Text>
          {plan.responses.map((item) => <View key={item.user_id}>
            <Text style={styles.body}>{workspace?.members.find((member) => member.user_id === item.user_id)?.name ?? 'Former member'} · {item.state === 'confirmed' ? 'Confirmed' : item.state === 'declined' ? 'Changes requested' : 'Not yet confirmed'}</Text>
            {item.response_note ? <Text style={styles.body}>{item.response_note}</Text> : null}
          </View>)}
          {!closed && current ? <>
            <Text style={styles.body}>Confirmation records your agreement to these details. KAJORA does not collect payment.</Text>
            <Button disabled={busy || response?.state === 'confirmed'} label={response?.state === 'confirmed' ? 'You confirmed this version' : 'Confirm this plan'} onPress={() => void act('respond_group_plan', { target_plan: plan.id, agrees: true })} />
            <Button disabled={busy} variant="secondary" label="Request a change" onPress={() => setAskingChange(!askingChange)} />
            {askingChange ? <>
              <TextInput accessibilityLabel="Change requested" multiline maxLength={500} style={styles.input} value={note} onChangeText={setNote} placeholder="What needs to change?" placeholderTextColor={colors.muted} />
              <Button disabled={busy || !note.trim()} label="Send change request" onPress={async () => {
                if (await act('respond_group_plan', { target_plan: plan.id, agrees: false, note })) { setNote(''); setAskingChange(false); }
              }} />
            </> : null}
          </> : null}
        </> : workspace ? <Text style={styles.body}>Discuss the supplier, portions and costs in chat. The organiser can then propose a plan for everyone to review.</Text> : null}
        {owner && !closed && workspace ? <>
          {!draft ? <Button disabled={busy} variant="secondary" label={plan ? 'Revise the plan' : 'Prepare group plan'} onPress={edit} /> : <View style={styles.stack}>
            <Text style={styles.body}>Publishing pauses new joins and asks every member, including you, to confirm. Revising resets all confirmations.</Text>
            {fields.map((field) => <View key={field.key} style={{ gap: 5 }}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput accessibilityLabel={field.label} style={styles.input} value={draft[field.key]} editable={!busy}
                multiline={field.key !== 'total'} keyboardType={field.key === 'total' ? 'decimal-pad' : 'default'} maxLength={field.key === 'total' ? 13 : 1200}
                placeholder={field.hint} placeholderTextColor={colors.muted} onChangeText={(value) => setDraft({ ...draft, [field.key]: value })} />
            </View>)}
            <Button loading={busy} label="Publish for confirmation" onPress={() => void publish()} />
            <Button disabled={busy} variant="quiet" label="Discard edit" onPress={() => setDraft(null)} />
          </View>}
          {closing ? <>
            <Text style={styles.body}>{closing === 'completed' ? 'Mark this purchase completed?' : 'Cancel this purchase?'} The group will become read-only.</Text>
            <Button disabled={busy} variant="danger" label="Yes, close this purchase" onPress={async () => {
              if (await act('close_buying_group', { target_group: group.id, outcome: closing })) setClosing(null);
            }} />
            <Button disabled={busy} variant="quiet" label="Keep planning" onPress={() => setClosing(null)} />
          </> : <>
            <Button disabled={busy || plan?.state !== 'confirmed'} variant="secondary" label="Mark purchase completed" onPress={() => setClosing('completed')} />
            <Button disabled={busy} variant="quiet" label="Cancel purchase" onPress={() => setClosing('closed')} />
          </>}
        </> : null}
      </View>
      {workspace ? <GroupPolls polls={workspace.polls} members={workspace.members} groupId={group.id} owner={owner} closed={closed} busy={busy} act={act} /> : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  stack: { gap: spacing.md, marginTop: spacing.md },
  card: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  title: { color: colors.ink, fontSize: type.title, fontWeight: '700' },
  label: { color: colors.greenDark, fontSize: type.small, fontWeight: '700', marginBottom: 3 },
  body: { color: colors.ink, fontSize: type.small, lineHeight: 20 },
  input: { color: colors.ink, borderColor: colors.line, borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm, minHeight: 44, fontSize: type.small, backgroundColor: colors.canvas },
  error: { color: colors.danger, fontSize: type.small, lineHeight: 20 },
});
