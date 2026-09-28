import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui';
import { useAuth } from '@/state/auth-context';
import { colors, radius, spacing, type } from '@/theme';

function normaliseNigerianNumber(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('0') ? digits.slice(1, 11) : digits.slice(0, 10);
}

export default function PhoneScreen() {
  const router = useRouter();
  const { beginPhoneSignIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = phone.length === 10;

  const continueToCode = async () => {
    setAttempted(true);
    if (!valid) return;
    setError('');
    setLoading(true);
    const authError = await beginPhoneSignIn(`+234${phone}`);
    setLoading(false);
    if (authError) {
      setError(authError);
      return;
    }
    router.push('/auth/verify');
  };

  return (
    <AuthShell
      description="We use your number to secure your account and reduce anonymous activity in buying groups."
      eyebrow="Step 1 of 3"
      title="What’s your phone number?"
      footer={<Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>}>
      <Text style={styles.label}>Nigerian phone number</Text>
      <View style={[styles.phoneField, attempted && !valid && styles.fieldError]}>
        <View style={styles.prefix}><Text style={styles.flag}>🇳🇬</Text><Text style={styles.prefixText}>+234</Text></View>
        <TextInput
          accessibilityLabel="Phone number"
          autoComplete="tel"
          keyboardType="phone-pad"
          maxLength={11}
          onChangeText={(value) => setPhone(normaliseNigerianNumber(value))}
          onSubmitEditing={continueToCode}
          placeholder="801 234 5678"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          style={styles.input}
          value={phone}
        />
      </View>
      {attempted && !valid ? <Text style={styles.error}>Enter the 10 digits after +234.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button disabled={!valid} label="Send verification code" loading={loading} onPress={continueToCode} />
      <Text style={styles.help}>For example, 0801 234 5678 becomes +234 801 234 5678.</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.ink, fontSize: type.small, fontWeight: '700' },
  phoneField: { alignItems: 'center', borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', minHeight: 50, overflow: 'hidden' },
  fieldError: { borderColor: colors.danger },
  prefix: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.sageSoft, borderRightColor: colors.line, borderRightWidth: 1, flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.md },
  flag: { fontSize: 15 },
  prefixText: { color: colors.greenDark, fontSize: type.body, fontWeight: '700' },
  input: { color: colors.ink, flex: 1, fontSize: 16, minHeight: 48, paddingHorizontal: spacing.md },
  error: { color: colors.danger, fontSize: type.small },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  back: { color: colors.greenDark, fontSize: type.small, fontWeight: '700', textAlign: 'center' },
});
