import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppShell } from '@/components/app-shell';
import { Button, SectionLabel, Wordmark } from '@/components/ui';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing, type } from '@/theme';
import type { IntentCategory } from '@/types';

export default function CreateScreen() {
  const router = useRouter();
  const { createIntent } = useKajora();
  const [category, setCategory] = useState<IntentCategory>('Livestock');
  const [product, setProduct] = useState('');
  const [title, setTitle] = useState('');
  const [share, setShare] = useState('');
  const [timing, setTiming] = useState('');
  const [location, setLocation] = useState('Osogbo, Osun State');
  const [description, setDescription] = useState('');

  const ready = product.trim() && title.trim() && share.trim() && timing.trim() && location.trim() && description.trim();

  const publish = () => {
    if (!ready) return;
    const id = createIntent({
      category,
      product: product.trim(),
      title: title.trim(),
      desiredShare: share.trim(),
      timing: timing.trim(),
      location: location.trim(),
      description: description.trim(),
    });
    router.replace({ pathname: '/intents/[id]', params: { id } });
  };

  return (
    <AppShell activeRoute="create">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Wordmark compact />
            <Pressable onPress={() => router.back()}><Text style={styles.cancel}>Cancel</Text></Pressable>
          </View>

          <Text style={styles.eyebrow}>NEW BUYING INTENTION</Text>
          <Text style={styles.heading}>What do you want to buy with others?</Text>
          <Text style={styles.lede}>
            You do not need a seller or final price yet. Start with what you know; the group can decide the rest.
          </Text>

          <View style={styles.form}>
            <View>
              <SectionLabel>CATEGORY</SectionLabel>
              <View style={styles.categories}>
                {(['Livestock', 'Foodstuff', 'Household'] as IntentCategory[]).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[styles.category, category === item && styles.categorySelected]}>
                    <Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>{item}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Field label="PRODUCT" placeholder="e.g. Cow" value={product} onChangeText={setProduct} />
            <Field
              label="WHAT SHOULD PEOPLE SEE?"
              placeholder="e.g. Looking for people to share a cow"
              value={title}
              onChangeText={setTitle}
            />
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Field label="YOUR PREFERRED SHARE" placeholder="e.g. About half" value={share} onChangeText={setShare} />
              </View>
              <View style={styles.column}>
                <Field label="WHEN" placeholder="e.g. Before 19 Oct" value={timing} onChangeText={setTiming} />
              </View>
            </View>
            <Field label="GENERAL LOCATION" placeholder="Town or neighbourhood" value={location} onChangeText={setLocation} />
            <Field
              label="A SHORT NOTE"
              multiline
              placeholder="Tell people what you need and what is still flexible."
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.reminder}>
            <Text style={styles.reminderTitle}>Before publishing</Text>
            <Text style={styles.reminderBody}>
              Do not include your home address or promise a price that the group has not agreed.
            </Text>
          </View>

          <Button disabled={!ready} label="Publish intention" onPress={publish} />
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

function Field({ label, multiline = false, ...inputProps }: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <SectionLabel>{label}</SectionLabel>
      <TextInput
        {...inputProps}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multiline]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md },
  cancel: { color: colors.muted, fontSize: type.small, fontWeight: '600' },
  eyebrow: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: spacing.xl },
  heading: { color: colors.ink, fontSize: 32, fontWeight: '700', letterSpacing: -0.8, lineHeight: 38, marginTop: spacing.sm },
  lede: { color: colors.muted, fontSize: type.body, lineHeight: 23, marginTop: spacing.md },
  form: { gap: spacing.lg, marginTop: spacing.xl },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  category: { borderColor: colors.line, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 10 },
  categorySelected: { backgroundColor: colors.green, borderColor: colors.green },
  categoryText: { color: colors.muted, fontSize: type.small, fontWeight: '600' },
  categoryTextSelected: { color: colors.paper },
  input: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: type.body, marginTop: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md },
  multiline: { minHeight: 112, paddingTop: spacing.md },
  twoColumns: { flexDirection: 'row', gap: spacing.sm },
  column: { flex: 1 },
  reminder: { backgroundColor: colors.sageSoft, borderRadius: radius.md, marginBottom: spacing.md, marginTop: spacing.xl, padding: spacing.md },
  reminderTitle: { color: colors.greenDark, fontSize: type.small, fontWeight: '700' },
  reminderBody: { color: colors.muted, fontSize: type.small, lineHeight: 19, marginTop: 4 },
});
