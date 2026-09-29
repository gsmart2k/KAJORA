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
      <View accessible accessibilityLabel="Two neighbours carrying a shared purchase" style={styles.illustration}>
        <View style={styles.sun} />
        <View style={styles.horizonLine} />

        <View style={[styles.person, styles.personLeft]}>
          <View style={styles.head}><View style={styles.faceMark} /></View>
          <View style={styles.body} />
          <View style={[styles.arm, styles.armLeft]} />
        </View>

        <View style={styles.sharedBox}>
          <View style={styles.boxHandle} />
          <View style={styles.boxDivider} />
          <View style={[styles.boxMark, styles.boxMarkLeft]} />
          <View style={[styles.boxMark, styles.boxMarkRight]} />
        </View>

        <View style={[styles.person, styles.personRight]}>
          <View style={styles.head}><View style={styles.faceMark} /></View>
          <View style={styles.body} />
          <View style={[styles.arm, styles.armRight]} />
        </View>

        <View style={styles.groundLine} />
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
  sun: { backgroundColor: 'rgba(231, 168, 50, 0.18)', borderColor: colors.ochre, borderRadius: 18, borderWidth: 1.5, height: 36, position: 'absolute', right: 28, top: 20, width: 36 },
  horizonLine: { backgroundColor: 'rgba(27, 81, 60, 0.12)', height: 1, left: 28, position: 'absolute', right: 28, top: 55 },
  person: { alignItems: 'center', bottom: 22, height: 92, position: 'absolute', width: 64, zIndex: 1 },
  personLeft: { left: '20%' },
  personRight: { right: '20%' },
  head: { alignItems: 'center', backgroundColor: colors.paper, borderColor: colors.greenDark, borderRadius: 15, borderWidth: 2, height: 30, justifyContent: 'center', width: 30, zIndex: 2 },
  faceMark: { backgroundColor: colors.clay, borderRadius: 2, height: 3, width: 3 },
  body: { backgroundColor: 'rgba(255, 255, 255, 0.52)', borderColor: colors.greenDark, borderRadius: 24, borderWidth: 2, bottom: 0, height: 62, position: 'absolute', width: 48 },
  arm: { backgroundColor: colors.greenDark, bottom: 33, height: 2, position: 'absolute', width: 46, zIndex: 3 },
  armLeft: { left: 36, transform: [{ rotate: '15deg' }] },
  armRight: { right: 36, transform: [{ rotate: '-15deg' }] },
  sharedBox: { backgroundColor: colors.paper, borderColor: colors.greenDark, borderRadius: radius.sm, borderWidth: 2, bottom: 20, height: 56, left: '50%', marginLeft: -48, position: 'absolute', width: 96, zIndex: 4 },
  boxHandle: { borderColor: colors.greenDark, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 2, borderBottomWidth: 0, height: 17, left: 27, position: 'absolute', top: -15, width: 38 },
  boxDivider: { backgroundColor: colors.line, bottom: 0, left: '50%', position: 'absolute', top: 0, width: 1 },
  boxMark: { borderColor: colors.clay, borderRadius: 8, borderWidth: 2, height: 16, position: 'absolute', top: 19, width: 16 },
  boxMarkLeft: { left: 16 },
  boxMarkRight: { right: 16 },
  groundLine: { backgroundColor: 'rgba(27, 81, 60, 0.28)', bottom: 18, height: 1, left: 34, position: 'absolute', right: 34 },
  promiseList: { gap: spacing.md },
  promiseRow: { alignItems: 'center', flexDirection: 'row' },
  number: { color: colors.clay, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, width: 22 },
  promiseLine: { backgroundColor: colors.line, height: 1, marginRight: spacing.md, width: 20 },
  promiseText: { color: colors.ink, flex: 1, fontSize: type.body, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  terms: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
