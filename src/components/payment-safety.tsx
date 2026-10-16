import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export function PaymentSafety({ compact = false }: { compact?: boolean }) {
  return <View style={styles.notice}>
    <Text style={styles.title}>Meet first. Inspect. Agree. Then pay.</Text>
    <Text style={styles.body}>{compact ? 'No deposits or advance payments. Report anyone asking for one.' : 'Meet in a public place, inspect the product and agree on everyone’s share before paying. No deposits or reservation fees. KAJORA does not hold or guarantee payments.'}</Text>
  </View>;
}
const styles = StyleSheet.create({
  notice: { backgroundColor: colors.sageSoft, padding: 12, borderRadius: 12, marginVertical: 8 },
  title: { color: colors.green, fontSize: 12, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
});
