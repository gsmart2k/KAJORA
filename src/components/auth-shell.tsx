import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Wordmark } from '@/components/ui';
import { colors, radius, spacing, type } from '@/theme';

type AuthShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
}>;

export function AuthShell({ children, eyebrow, title, description, footer }: AuthShellProps) {
  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.frame}>
            <Wordmark />
            <View style={styles.rule} />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
            <View style={styles.card}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.canvas, flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  frame: { alignSelf: 'center', maxWidth: 470, width: '100%' },
  rule: { backgroundColor: colors.green, height: 2, marginBottom: spacing.xl, marginTop: spacing.lg, width: 44 },
  eyebrow: { color: colors.clay, fontSize: 11, fontWeight: '800', letterSpacing: 1.35, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 34, fontWeight: '700', letterSpacing: -0.8, lineHeight: 40, marginTop: spacing.sm },
  description: { color: colors.muted, fontSize: type.body, lineHeight: 24, marginTop: spacing.sm, maxWidth: 420 },
  card: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  footer: { marginTop: spacing.lg },
});
