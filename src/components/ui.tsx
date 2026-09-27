import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, type } from '@/theme';

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <View accessibilityLabel="KAJORA" style={styles.wordmarkRow}>
      <View style={[styles.wordmarkMark, compact && styles.wordmarkMarkCompact]}>
        <Text style={[styles.wordmarkK, compact && styles.wordmarkKCompact]}>K</Text>
      </View>
      <View>
        <Text style={[styles.wordmark, compact && styles.wordmarkCompact]}>KAJORA</Text>
        {!compact && <Text style={styles.wordmarkLine}>let’s buy together</Text>}
      </View>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.paper : colors.green} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonLabel, styles[`buttonLabel_${variant}`]]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Avatar({ initials, size = 38 }: { initials: string; size?: number }) {
  return (
    <View style={[styles.avatar, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={[styles.avatarText, size < 35 && { fontSize: 10 }]}>{initials}</Text>
    </View>
  );
}

export function SectionLabel({ children }: PropsWithChildren) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'green' | 'clay' }) {
  return (
    <View style={[styles.pill, styles[`pill_${tone}`]]}>
      <Text style={[styles.pillText, styles[`pillText_${tone}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  wordmarkMark: { alignItems: 'center', backgroundColor: colors.clay, borderRadius: 12, height: 34, justifyContent: 'center', width: 34 },
  wordmarkMarkCompact: { borderRadius: 10, height: 30, width: 30 },
  wordmarkK: { color: colors.white, fontSize: 19, fontWeight: '900' },
  wordmarkKCompact: { fontSize: 16 },
  wordmark: { color: colors.greenDark, fontSize: 18, fontWeight: '900', letterSpacing: 1.5 },
  wordmarkCompact: { fontSize: 16, letterSpacing: 1.3 },
  wordmarkLine: { color: colors.muted, fontSize: 8, fontWeight: '600', letterSpacing: 0.15, marginTop: -1 },
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  button_primary: { backgroundColor: colors.clay },
  button_secondary: { backgroundColor: colors.paper, borderColor: colors.line, borderWidth: 1 },
  button_quiet: { backgroundColor: colors.sageSoft },
  button_danger: { backgroundColor: colors.claySoft },
  buttonLabel: { fontSize: type.body, fontWeight: '700' },
  buttonLabel_primary: { color: colors.white },
  buttonLabel_secondary: { color: colors.ink },
  buttonLabel_quiet: { color: colors.greenDark },
  buttonLabel_danger: { color: colors.danger },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
  avatar: { alignItems: 'center', backgroundColor: colors.sage, borderColor: colors.white, borderWidth: 2, justifyContent: 'center' },
  avatarText: { color: colors.greenDark, fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  sectionLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  pill: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  pill_neutral: { backgroundColor: colors.quiet },
  pill_green: { backgroundColor: colors.sage },
  pill_clay: { backgroundColor: colors.claySoft },
  pillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },
  pillText_neutral: { color: colors.muted },
  pillText_green: { color: colors.greenDark },
  pillText_clay: { color: colors.clay },
});
