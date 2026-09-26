import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Avatar, Button } from '@/components/ui';
import { useAuth } from '@/state/auth-context';
import { colors, radius, spacing, type } from '@/theme';

const locations = ['Osogbo', 'Olorunda', 'Ede', 'Ilesa'];

export default function ProfileSetupScreen() {
  const { completeProfile } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('Osogbo');
  const initials = name.trim() ? name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() : 'KJ';
  const ready = name.trim().length >= 2;

  const finish = () => {
    if (!ready) return;
    completeProfile({ name: name.trim(), location: `${location}, Osun State` });
  };

  return (
    <AuthShell
      description="A recognisable name and general area make group conversations feel safer and more useful."
      eyebrow="Step 3 of 3"
      title="Introduce yourself"
      footer={<Text style={styles.privacy}>Your precise address is never shown publicly.</Text>}>
      <View style={styles.avatarRow}>
        <Avatar initials={initials} size={58} />
        <View style={styles.avatarCopy}>
          <Text style={styles.avatarTitle}>Profile photo can come later</Text>
          <Text style={styles.avatarText}>We’ll use your initials for now.</Text>
        </View>
      </View>
      <Text style={styles.label}>Name people will see</Text>
      <TextInput
        accessibilityLabel="Display name"
        autoCapitalize="words"
        autoComplete="name"
        onChangeText={setName}
        onSubmitEditing={finish}
        placeholder="For example, Tobi Ade"
        placeholderTextColor={colors.muted}
        returnKeyType="done"
        style={styles.input}
        value={name}
      />
      <Text style={styles.label}>Your area</Text>
      <View style={styles.locationList}>
        {locations.map((item) => {
          const selected = item === location;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={item}
              onPress={() => setLocation(item)}
              style={[styles.location, selected && styles.locationSelected]}>
              <Text style={[styles.locationText, selected && styles.locationTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button disabled={!ready} label="Enter KAJORA" onPress={finish} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  avatarRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  avatarCopy: { flex: 1 },
  avatarTitle: { color: colors.ink, fontSize: type.small, fontWeight: '700' },
  avatarText: { color: colors.muted, fontSize: 12, marginTop: 3 },
  label: { color: colors.ink, fontSize: type.small, fontWeight: '700', marginTop: spacing.xs },
  input: { borderColor: colors.line, borderRadius: radius.md, borderWidth: 1, color: colors.ink, fontSize: type.body, minHeight: 54, paddingHorizontal: spacing.md },
  locationList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  location: { borderColor: colors.line, borderRadius: radius.full, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  locationSelected: { backgroundColor: colors.green, borderColor: colors.green },
  locationText: { color: colors.muted, fontSize: type.small, fontWeight: '700' },
  locationTextSelected: { color: colors.paper },
  privacy: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
