import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, StatusPill } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';
import type { Intent } from '@/types';

const accentColors = {
  green: colors.green,
  clay: colors.clay,
  ochre: colors.ochre,
};

export function IntentCard({ intent, onPress }: { intent: Intent; onPress: () => void }) {
  const available = intent.type === 'available-share';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.accent, { backgroundColor: accentColors[intent.accent] }]} />
      <View style={styles.header}>
        <Avatar initials={intent.creator.initials} />
        <View style={styles.creatorText}>
          <Text style={styles.creator}>{intent.creator.name}</Text>
          <Text style={styles.meta}>{intent.area} · {intent.createdAgo}</Text>
        </View>
        <StatusPill label={available ? 'SHARE AVAILABLE' : 'BUYING INTENT'} tone={available ? 'clay' : 'green'} />
      </View>

      <Text style={styles.title}>{intent.title}</Text>
      <Text numberOfLines={2} style={styles.description}>{intent.description}</Text>

      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>WANTS</Text>
          <Text style={styles.detailValue}>{intent.desiredShare}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>WHEN</Text>
          <Text style={styles.detailValue}>{intent.timing}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.interest}>{intent.interestedCount} {intent.interestedCount === 1 ? 'person' : 'people'} interested</Text>
        <Text style={styles.open}>View post →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.md,
  },
  pressed: { opacity: 0.8 },
  accent: { height: 3, left: 0, position: 'absolute', right: 0, top: 0 },
  header: { alignItems: 'center', flexDirection: 'row' },
  creatorText: { flex: 1, marginLeft: spacing.sm },
  creator: { color: colors.ink, fontSize: type.small, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  title: { color: colors.ink, fontSize: type.title, fontWeight: '700', letterSpacing: -0.2, lineHeight: 23, marginTop: spacing.md },
  description: { color: colors.muted, fontSize: type.small, lineHeight: 18, marginTop: spacing.xs },
  details: {
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  detail: { flex: 1 },
  detailDivider: { backgroundColor: colors.line, marginHorizontal: spacing.md, width: 1 },
  detailLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  detailValue: { color: colors.ink, fontSize: type.small, fontWeight: '600', marginTop: 4 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  interest: { color: colors.greenDark, fontSize: type.small, fontWeight: '700' },
  open: { color: colors.muted, fontSize: type.small },
});
