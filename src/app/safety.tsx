import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui';
import { PaymentSafety } from '@/components/payment-safety';
import { reportReasons } from '@/components/report-action';
import { ChatImage } from '@/components/chat-image';
import { fetchMySafetyReports, planningAction, type SafetyReport } from '@/lib/supabase-rest';
import { useAuth } from '@/state/auth-context';
import { colors } from '@/theme';

type Decision = 'resolve' | 'dismiss' | 'hide_intention' | 'suspend_account' | 'restore_account';
const decisions: Record<Decision, string> = {
  resolve: 'Mark reviewed', dismiss: 'Dismiss report', hide_intention: 'Hide intention and close its group',
  suspend_account: 'Suspend reported account', restore_account: 'Restore reported account',
};
export default function SafetyScreen() {
  const router = useRouter();
  const { supabaseSession } = useAuth();
  const [focused, setFocused] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [queue, setQueue] = useState(false);
  const [all, setAll] = useState(false);
  const [offset, setOffset] = useState(0);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<{ report: string; decision: Decision } | null>(null);
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (!supabaseSession) return;
    const version = ++generation.current;
    setLoading(true); setError('');
    try {
      const isAdmin = await planningAction<boolean>(supabaseSession, 'is_moderator', {});
      const rows = queue && isAdmin
        ? await planningAction<SafetyReport[]>(supabaseSession, 'list_safety_reports', { queue_status: all ? 'all' : 'open', page_offset: offset })
        : await fetchMySafetyReports(supabaseSession);
      if (version === generation.current) { setAdmin(isAdmin); setReports(rows); }
    } catch (e) {
      if (version === generation.current) { setReports([]); setAdmin(false); setError(e instanceof Error ? e.message : 'Could not load reports.'); }
    } finally { if (version === generation.current) setLoading(false); }
  }, [supabaseSession, queue, all, offset]);
  useFocusEffect(useCallback(() => { setFocused(true); void load(); return () => { setFocused(false); generation.current += 1; }; }, [load]));
  const review = async () => {
    if (!supabaseSession || !pending || busy) return;
    setBusy(true); setError('');
    try {
      await planningAction(supabaseSession, 'review_safety_report', { target_report: pending.report, decision: pending.decision, review_note: note.trim() });
      setPending(null); setNote(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the review.'); }
    finally { setBusy(false); }
  };
  return <AppShell><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Button label="Back" variant="quiet" onPress={() => router.back()} />
    <Text style={styles.title}>{queue && admin ? 'Admin review' : 'Safety centre'}</Text>
    <PaymentSafety />
    <Text style={styles.body}>Report an intention from its details page, or a message from its group chat. Reports are private to you and authorised admins. Check here for updates; reviews are not immediate.</Text>
    {admin ? <Button disabled={busy} variant="secondary" label={queue ? 'View my reports' : 'Open admin review'} onPress={() => { setQueue(!queue); setOffset(0); setPending(null); }} /> : null}
    {queue && admin ? <Button disabled={busy} variant="quiet" label={all ? 'Show open reports only' : 'Include reviewed reports'} onPress={() => { setAll(!all); setOffset(0); setPending(null); }} /> : <Text style={styles.label}>Your latest 50 reports</Text>}
    <Button label={loading ? 'Loading…' : 'Refresh reports'} disabled={loading || busy} variant="quiet" onPress={() => void load()} />
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {!loading && !error && !reports.length ? <Text style={styles.body}>No reports to show.</Text> : null}
    {!loading ? reports.map(report => <View key={report.id} style={styles.card}>
      <Text style={styles.label}>{reportReasons.find(([key]) => key === report.category)?.[1] ?? report.category}</Text>
      <Text style={styles.meta}>{report.status === 'resolved' ? 'Reviewed' : report.status === 'dismissed' ? 'Dismissed' : 'Awaiting review'} · {new Date(report.created_at).toLocaleDateString()}</Text>
      {report.snapshot.title || report.snapshot.body ? <Text style={styles.quote}>{report.snapshot.title ?? report.snapshot.body}</Text> : null}
      <Text style={styles.body}>{report.details}</Text>
      <Text selectable style={styles.meta}>Reference: {report.id}</Text>
      {queue && admin ? <>
        <Text style={styles.label}>{report.subject_name ?? 'Unknown account'} · {report.subject_account_state ?? 'unknown'}</Text>
        {report.snapshot.description ? <Text style={styles.body}>{report.snapshot.description}</Text> : null}
        {report.snapshot.image_path ? <ChatImage path={report.snapshot.image_path} focused={focused} /> : null}
        {report.actions?.map(action => <Text key={action.id} style={styles.meta}>{action.action.replaceAll('_', ' ')} · {new Date(action.created_at).toLocaleString()}{'\n'}{action.note}</Text>)}
        {pending?.report === report.id ? <View style={styles.confirm}>
          <Text style={styles.label}>{decisions[pending.decision]}?</Text>
          <Text style={styles.body}>{pending.decision === 'hide_intention' ? 'The listing will leave public discovery. Its group becomes read-only for existing members. This action cannot be undone from this screen.' : pending.decision === 'suspend_account' ? 'This account will lose access to app data and actions. You can restore it through this report after review.' : 'This decision and your note will be recorded in the admin audit history.'}</Text>
          <TextInput accessibilityLabel="Admin review note" placeholder="Reason for this decision (at least 5 characters)" multiline maxLength={1000} value={note} onChangeText={setNote} style={styles.input} />
          <Button label="Confirm action" loading={busy} disabled={busy || note.trim().length < 5} onPress={() => void review()} />
          <Button label="Cancel" disabled={busy} variant="quiet" onPress={() => setPending(null)} />
        </View> : <>
          {(Object.keys(decisions) as Decision[]).filter(d => d === 'restore_account' ? report.subject_account_state === 'suspended' : d === 'suspend_account' ? report.subject_account_state !== 'suspended' : report.status === 'open').map(decision => <Button key={decision} label={decisions[decision]} variant="quiet" disabled={busy} onPress={() => { setPending({ report: report.id, decision }); setNote(''); }} />)}
        </>}
      </> : null}
    </View>) : null}
    {queue && admin ? <View style={styles.pagination}>
      <Button label="Previous" variant="quiet" disabled={offset === 0 || loading || busy} onPress={() => { setOffset(Math.max(0, offset - 50)); setPending(null); }} />
      <Button label="Next" variant="quiet" disabled={reports.length < 50 || loading || busy} onPress={() => { setOffset(offset + 50); setPending(null); }} />
    </View> : null}
  </ScrollView></AppShell>;
}
const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 14 }, title: { color: colors.ink, fontSize: 24, fontWeight: '700' },
  body: { color: colors.ink, fontSize: 13, lineHeight: 20 }, label: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 11, lineHeight: 17 }, error: { color: colors.danger, fontSize: 13 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderColor: colors.line, borderWidth: 1, padding: 16, gap: 10 },
  quote: { color: colors.green, fontSize: 13, lineHeight: 20 }, confirm: { gap: 12, paddingTop: 12 },
  input: { color: colors.ink, minHeight: 90, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between' },
});
