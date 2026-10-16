import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { planningAction } from '@/lib/supabase-rest';
import { useAuth } from '@/state/auth-context';
import { colors } from '@/theme';

export const reportReasons = [
  ['advance_payment', 'Asking for advance payment'], ['fake_intention', 'Fake product or intention'],
  ['impersonation', 'Impersonation'], ['harassment', 'Harassment or threats'], ['other', 'Something else'],
] as const;
export function ReportAction({ kind, target, label = 'Report' }: { kind: 'post' | 'message'; target: string; label?: string }) {
  const { supabaseSession } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('advance_payment');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const submit = async () => {
    if (!supabaseSession || busy) return;
    setBusy(true); setError('');
    try {
      await planningAction(supabaseSession, 'submit_safety_report', { kind, target, reason, explanation: details.trim() });
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send your report. Please retry.'); }
    finally { setBusy(false); }
  };
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => { setOpen(true); setError(''); }} style={styles.trigger}><Text style={styles.link}>{label}</Text></Pressable>
    <Modal visible={open} animationType="slide" onRequestClose={() => { if (!busy) setOpen(false); }}>
      <SafeAreaView style={styles.page}>
        <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{sent ? 'Report received' : 'Report a concern'}</Text>
            {sent ? <Text style={styles.body}>Your report is saved for admin review. It is not shared with the person you reported. You can check its status in Profile → Safety centre. Review is not immediate.</Text> : <>
              <Text style={styles.body}>Tell us what happened. Don’t include passwords, card details or unrelated personal information. Reporting does not automatically suspend anyone.</Text>
              {reportReasons.map(([value, text]) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: reason === value }} onPress={() => setReason(value)} style={[styles.option, reason === value && styles.selected]}><Text style={styles.body}>{text}</Text></Pressable>)}
              <Text style={styles.label}>What happened?</Text>
              <TextInput accessibilityLabel="Report details" multiline maxLength={2000} value={details} onChangeText={setDetails} placeholder="Describe the request or behaviour (at least 10 characters)" style={styles.input} textAlignVertical="top" />
              {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
              <Button label="Submit report" loading={busy} disabled={!supabaseSession || details.trim().length < 10 || busy} onPress={() => void submit()} />
            </>}
            <Button label={sent ? 'Done' : 'Cancel'} variant="quiet" disabled={busy} onPress={() => setOpen(false)} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 24, gap: 14 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '700' }, body: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  trigger: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }, link: { color: colors.muted, fontSize: 11, textDecorationLine: 'underline' },
  option: { padding: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 12 }, selected: { borderColor: colors.green, backgroundColor: colors.sageSoft },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, minHeight: 120, color: colors.ink, backgroundColor: colors.paper },
  error: { color: colors.danger, fontSize: 13 },
});
