import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

const promises = ['Find people nearby', 'Agree together', 'Buy only what you need'];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <AuthShell
      description="A local place for people who want to split the cost and quantity of a shared purchase."
      eyebrow="Osogbo pilot"
      title="Buy together, without the guesswork."
      footer={<Text style={styles.terms}>By continuing, you agree to keep group conversations honest and respectful.</Text>}>
      <View style={styles.promiseList}>
        {promises.map((promise, index) => (
          <View key={promise} style={styles.promiseRow}>
            <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
            <Text style={styles.promiseText}>{promise}</Text>
          </View>
        ))}
      </View>
      <Button label="Continue with phone number" onPress={() => router.push('/auth/phone')} />
      <Text style={styles.note}>KAJORA will never display your phone number on the public wall.</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  promiseList: { gap: spacing.sm },
  promiseRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  number: { alignItems: 'center', backgroundColor: colors.sageSoft, borderRadius: radius.full, height: 30, justifyContent: 'center', width: 30 },
  numberText: { color: colors.greenDark, fontSize: type.small, fontWeight: '800' },
  promiseText: { color: colors.ink, flex: 1, fontSize: type.body, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  terms: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
