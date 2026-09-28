import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui';
import { TEST_OTP, useAuth } from '@/state/auth-context';
import { colors, radius, spacing, type } from '@/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const { backendMode, pendingPhone, verifyOtp } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const codeLength = backendMode === 'supabase' ? 6 : 4;

  const verify = async () => {
    setLoading(true);
    const authError = await verifyOtp(code);
    setLoading(false);
    if (authError) setError(authError);
  };

  return (
    <AuthShell
      description={`Enter the ${codeLength}-digit code sent to ${pendingPhone || 'your phone number'}.`}
      eyebrow="Step 2 of 3"
      title="Check your messages"
      footer={<Pressable onPress={() => router.back()}><Text style={styles.back}>← Change phone number</Text></Pressable>}>
      <Text style={styles.label}>Verification code</Text>
      <TextInput
        accessibilityLabel={`${codeLength} digit verification code`}
        autoComplete="one-time-code"
        keyboardType="number-pad"
        maxLength={codeLength}
        onChangeText={(value) => { setCode(value.replace(/\D/g, '').slice(0, codeLength)); setError(''); }}
        onSubmitEditing={verify}
        placeholder="••••"
        placeholderTextColor={colors.line}
        returnKeyType="done"
        style={[styles.codeInput, error ? styles.codeError : null]}
        value={code}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {backendMode === 'demo' ? (
        <View style={styles.testCode}>
          <Text style={styles.testLabel}>PROTOTYPE CODE</Text>
          <Text selectable style={styles.testValue}>{TEST_OTP}</Text>
          <Text style={styles.testText}>Add Supabase keys to enable real SMS.</Text>
        </View>
      ) : null}
      <Button disabled={code.length !== codeLength} label="Verify number" loading={loading} onPress={verify} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.ink, fontSize: type.small, fontWeight: '700' },
  codeInput: { borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: 26, fontWeight: '700', letterSpacing: 12, minHeight: 56, paddingHorizontal: spacing.md, textAlign: 'center' },
  codeError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: type.small, lineHeight: 19 },
  testCode: { alignItems: 'center', backgroundColor: colors.sageSoft, borderRadius: radius.md, padding: spacing.md },
  testLabel: { color: colors.greenDark, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  testValue: { color: colors.greenDark, fontSize: 21, fontWeight: '800', letterSpacing: 4, marginTop: spacing.xs },
  testText: { color: colors.muted, fontSize: 11, marginTop: spacing.xs },
  back: { color: colors.greenDark, fontSize: type.small, fontWeight: '700', textAlign: 'center' },
});
