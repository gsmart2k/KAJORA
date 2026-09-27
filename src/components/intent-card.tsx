import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, StatusPill } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';
import type { Intent } from '@/types';

const productIcons = {
  Livestock: '🐄',
  Foodstuff: '🌾',
  Household: '🧺',
} as const;

export function IntentCard({ intent, onPress }: { intent: Intent; onPress: () => void }) {
  const available = intent.type === 'available-share';
  const target = intent.desiredPeople ?? Math.max(intent.interestedCount + 2, 4);
  const progress = `${Math.min((intent.interestedCount / target) * 100, 100)}%` as `${number}%`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardTop}>
        <View style={[styles.productIcon, available && styles.productIconAvailable]}>
          <Text style={styles.productEmoji}>{productIcons[intent.category]}</Text>
        </View>
        <View style={styles.titleWrap}>
          <View style={styles.labelRow}>
            <Text style={styles.category}>{intent.category}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.area}>{intent.area}</Text>
          </View>
          <Text numberOfLines={2} style={styles.title}>{intent.title}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>YOUR SHARE</Text>
          <Text numberOfLines={1} style={styles.detailValue}>{intent.desiredShare}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>WHEN</Text>
          <Text numberOfLines={1} style={styles.detailValue}>{intent.timing}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progress, { width: progress }]} />
        </View>
        <Text style={styles.progressText}>{intent.interestedCount}/{target} people</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.creator}>
          <Avatar initials={intent.creator.initials} size={30} />
          <View>
            <Text style={styles.creatorName}>Started by {intent.creator.name}</Text>
            <Text style={styles.createdAgo}>{intent.createdAgo}</Text>
          </View>
        </View>
        <StatusPill label={available ? 'AVAILABLE' : 'OPEN'} tone={available ? 'clay' : 'green'} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: colors.greenDark,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  productIcon: { alignItems: 'center', backgroundColor: colors.sageSoft, borderRadius: radius.md, height: 52, justifyContent: 'center', width: 52 },
  productIconAvailable: { backgroundColor: colors.claySoft },
  productEmoji: { fontSize: 24 },
  titleWrap: { flex: 1, marginLeft: spacing.md },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  category: { color: colors.green, fontSize: type.caption, fontWeight: '800' },
  dot: { color: colors.line, fontSize: type.caption },
  area: { color: colors.muted, fontSize: type.caption },
  title: { color: colors.ink, fontSize: type.title, fontWeight: '700', letterSpacing: -0.2, lineHeight: 22, marginTop: 3 },
  arrow: { color: colors.muted, fontSize: 28, marginLeft: spacing.xs },
  details: { backgroundColor: colors.canvas, borderRadius: radius.md, flexDirection: 'row', marginTop: spacing.md, padding: spacing.sm },
  detail: { flex: 1, paddingHorizontal: spacing.xs },
  detailDivider: { backgroundColor: colors.line, marginHorizontal: spacing.sm, width: 1 },
  detailLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  detailValue: { color: colors.ink, fontSize: type.small, fontWeight: '700', marginTop: 4 },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  progressTrack: { backgroundColor: colors.quiet, borderRadius: radius.full, flex: 1, height: 5, overflow: 'hidden' },
  progress: { backgroundColor: colors.clay, borderRadius: radius.full, height: '100%' },
  progressText: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  footer: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md },
  creator: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  creatorName: { color: colors.ink, fontSize: type.caption, fontWeight: '700' },
  createdAgo: { color: colors.muted, fontSize: 9, marginTop: 2 },
});
