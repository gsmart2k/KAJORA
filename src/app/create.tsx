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
  const [people, setPeople] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ready = product.trim() && title.trim() && share.trim() && timing.trim() && location.trim() && description.trim();

  const publish = async () => {
    if (!ready) return;
    if (people.trim() && (!/^\d+$/.test(people.trim()) || Number(people) < 2 || Number(people) > 100)) {
      setError('Choose 2–100 people including yourself, or leave it blank.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const id = await createIntent({
        category,
        desiredPeople: people.trim() ? Number(people) : undefined,
        product: product.trim(),
        title: title.trim(),
        desiredShare: share.trim(),
        timing: timing.trim(),
        location: location.trim(),
        description: description.trim(),
      });
      router.replace({ pathname: '/intents/[id]', params: { id } });
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'The buying intention could not be published.');
    } finally {
      setLoading(false);
    }
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
            <Field label="TOTAL PEOPLE, INCLUDING YOU (OPTIONAL)" accessibilityLabel="Total people including you" keyboardType="number-pad" placeholder="Not sure yet" value={people} onChangeText={setPeople} />
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

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button disabled={!ready} label="Publish intention" loading={loading} onPress={publish} />
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
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: spacing.lg },
  heading: { color: colors.ink, fontSize: type.display, fontWeight: '700', letterSpacing: -0.55, lineHeight: 33, marginTop: spacing.xs },
  lede: { color: colors.muted, fontSize: type.body, lineHeight: 21, marginTop: spacing.sm },
  form: { gap: spacing.md, marginTop: spacing.lg },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  category: { borderColor: colors.line, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 8 },
  categorySelected: { backgroundColor: colors.green, borderColor: colors.green },
  categoryText: { color: colors.muted, fontSize: type.small, fontWeight: '600' },
  categoryTextSelected: { color: colors.paper },
  input: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: type.body, marginTop: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md },
  multiline: { minHeight: 96, paddingTop: spacing.md },
  twoColumns: { flexDirection: 'row', gap: spacing.sm },
  column: { flex: 1 },
  reminder: { backgroundColor: colors.sageSoft, borderRadius: radius.md, marginBottom: spacing.md, marginTop: spacing.lg, padding: spacing.md },
  reminderTitle: { color: colors.greenDark, fontSize: type.small, fontWeight: '700' },
  reminderBody: { color: colors.muted, fontSize: type.small, lineHeight: 19, marginTop: 4 },
  error: { color: colors.danger, fontSize: type.small, lineHeight: 19 },
});
