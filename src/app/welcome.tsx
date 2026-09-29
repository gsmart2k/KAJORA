import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

const promises = [
  ['01', 'Post what you want to buy'],
  ['02', 'Meet interested people nearby'],
  ['03', 'Agree the details together'],
] as const;

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <AuthShell
      description="Start a buying plan, find nearby people and split a bulk purchase without buying more than you need."
      eyebrow="Made for Osun communities"
      title="Good things cost less when we share."
      footer={<Text style={styles.terms}>By continuing, you agree to keep group conversations honest and respectful.</Text>}>
      <View accessible accessibilityLabel="Two neighbours sharing groceries" style={styles.illustration}>
        <View style={styles.illustrationSun} />
        <View style={styles.personOne}><Text style={styles.personInitial}>A</Text></View>
        <View style={styles.personTwo}><Text style={styles.personInitial}>M</Text></View>
        <View style={styles.sharedBag}><Text style={styles.sharedBagEmoji}>🧺</Text></View>
        <View style={styles.ground} />
      </View>
      <View style={styles.promiseList}>
        {promises.map(([number, promise]) => (
          <View key={number} style={styles.promiseRow}>
            <Text style={styles.number}>{number}</Text>
            <View style={styles.promiseLine} />
            <Text style={styles.promiseText}>{promise}</Text>
          </View>
        ))}
      </View>
      <Button label="Sign in to the alpha" onPress={() => router.push('/auth/phone')} />
      <Text style={styles.note}>Your email address is never displayed on the public wall.</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  illustration: { backgroundColor: colors.sky, borderRadius: radius.lg, height: 158, overflow: 'hidden', position: 'relative' },
  illustrationSun: { backgroundColor: colors.ochre, borderRadius: 22, height: 44, position: 'absolute', right: 28, top: 20, width: 44 },
  personOne: { alignItems: 'center', backgroundColor: colors.green, borderRadius: 30, bottom: 23, height: 82, justifyContent: 'center', left: '22%', position: 'absolute', transform: [{ rotate: '-6deg' }], width: 58 },
  personTwo: { alignItems: 'center', backgroundColor: colors.clay, borderRadius: 30, bottom: 23, height: 88, justifyContent: 'center', position: 'absolute', right: '22%', transform: [{ rotate: '6deg' }], width: 58 },
  personInitial: { color: colors.white, fontSize: 19, fontWeight: '900' },
  sharedBag: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.greenDark, borderRadius: radius.md, borderWidth: 2, bottom: 17, height: 64, justifyContent: 'center', left: '42%', position: 'absolute', width: 62, zIndex: 2 },
  sharedBagEmoji: { fontSize: 26 },
  ground: { backgroundColor: colors.sage, bottom: 0, height: 28, left: 0, position: 'absolute', right: 0 },
  promiseList: { gap: spacing.md },
  promiseRow: { alignItems: 'center', flexDirection: 'row' },
  number: { color: colors.clay, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, width: 22 },
  promiseLine: { backgroundColor: colors.line, height: 1, marginRight: spacing.md, width: 20 },
  promiseText: { color: colors.ink, flex: 1, fontSize: type.body, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  terms: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
