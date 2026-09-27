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
            <View style={styles.intro}>
              <Text style={styles.eyebrow}>{eyebrow}</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
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
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  frame: { alignSelf: 'center', maxWidth: 470, width: '100%' },
  intro: { marginTop: spacing.xl },
  eyebrow: { color: colors.clay, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: type.display, fontWeight: '700', letterSpacing: -0.55, lineHeight: 33, marginTop: spacing.sm },
  description: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm, maxWidth: 420 },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    shadowColor: colors.greenDark,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  footer: { marginTop: spacing.md },
});
