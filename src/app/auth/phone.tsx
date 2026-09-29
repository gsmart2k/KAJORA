import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui';
import { type EmailAuthAction, useAuth } from '@/state/auth-context';
import { colors, radius, spacing, type } from '@/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AccountScreen() {
  const router = useRouter();
  const { authenticateWithEmail, backendMode } = useAuth();
  const [action, setAction] = useState<EmailAuthAction>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const validEmail = EMAIL_PATTERN.test(email.trim());
  const validPassword = password.length >= 8;
  const ready = validEmail && validPassword;

  const submit = async () => {
    if (!ready) return;
    setError('');
    setLoading(true);
    const authError = await authenticateWithEmail(email.trim().toLowerCase(), password, action);
    setLoading(false);
    if (authError) setError(authError);
  };

  return (
    <AuthShell
      description={action === 'sign-up'
        ? 'Create a simple account for the KAJORA alpha. Phone verification will be added before public launch.'
        : 'Welcome back. Enter the email and password you used for KAJORA.'}
      eyebrow="Secure alpha access"
      title={action === 'sign-up' ? 'Create your account' : 'Sign in to KAJORA'}
      footer={<Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>}>
      <View style={styles.switcher}>
        {(['sign-up', 'sign-in'] as EmailAuthAction[]).map((item) => {
          const selected = action === item;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={item}
              onPress={() => { setAction(item); setError(''); }}
              style={[styles.switchOption, selected && styles.switchOptionSelected]}>
              <Text style={[styles.switchText, selected && styles.switchTextSelected]}>
                {item === 'sign-up' ? 'Create account' : 'Sign in'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          accessibilityLabel="Email address"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={(value) => { setEmail(value); setError(''); }}
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          returnKeyType="next"
          style={styles.input}
          value={email}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete={action === 'sign-up' ? 'new-password' : 'current-password'}
          onChangeText={(value) => { setPassword(value); setError(''); }}
          onSubmitEditing={() => void submit()}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.muted}
          returnKeyType="done"
          secureTextEntry
          style={styles.input}
          value={password}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        disabled={!ready}
        label={action === 'sign-up' ? 'Create account' : 'Sign in'}
        loading={loading}
        onPress={submit}
      />
      <Text style={styles.help}>
        {backendMode === 'demo'
          ? 'Demo mode is active until the Supabase public project values are added.'
          : 'Your password is handled by Supabase and is never stored by KAJORA.'}
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  switcher: { backgroundColor: colors.quiet, borderRadius: radius.md, flexDirection: 'row', padding: 4 },
  switchOption: { alignItems: 'center', borderRadius: radius.sm, flex: 1, paddingVertical: 9 },
  switchOptionSelected: { backgroundColor: colors.paper },
  switchText: { color: colors.muted, fontSize: type.small, fontWeight: '700' },
  switchTextSelected: { color: colors.greenDark },
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.ink, fontSize: type.small, fontWeight: '700' },
  input: { borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: type.body, minHeight: 50, paddingHorizontal: spacing.md },
  error: { color: colors.danger, fontSize: type.small, lineHeight: 19 },
  help: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  back: { color: colors.greenDark, fontSize: type.small, fontWeight: '700', textAlign: 'center' },
});
