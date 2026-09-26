import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppShell } from '@/components/app-shell';
import { Avatar, Button, StatusPill, Wordmark } from '@/components/ui';
import { useAuth } from '@/state/auth-context';
import { colors, radius, spacing, type } from '@/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const name = session?.name || 'KAJORA member';
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <AppShell activeRoute="profile">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Wordmark compact />
        <View style={styles.profileHeader}>
          <Avatar initials={initials} size={66} />
          <View style={styles.profileText}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.location}>{session?.location || 'Osun State'}</Text>
          </View>
          <StatusPill label="PHONE VERIFIED" tone="green" />
        </View>

        <View style={styles.stats}>
          <Stat label="Intentions" value="1" />
          <Stat label="Active groups" value="1" />
          <Stat label="Completed" value="0" />
        </View>

        <Text style={styles.sectionTitle}>Your KAJORA</Text>
        <View style={styles.settings}>
          <Setting title="Discovery area" value="Osogbo and nearby" />
          <Setting title="Interest alerts" value="Livestock, foodstuff" />
          <Setting title="Privacy" value="Phone number hidden" />
          <Setting title="Safety and reports" value="No open reports" />
        </View>

        <View style={styles.identityCard}>
          <Text style={styles.identityTitle}>Build trust gradually</Text>
          <Text style={styles.identityText}>
            KAJORA will show exactly what has been verified. A phone check never means a product or seller has been inspected.
          </Text>
          <Button label="Review verification" onPress={() => {}} variant="secondary" />
        </View>

        <Button label="Sign out" onPress={signOut} variant="danger" />
      </ScrollView>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Setting({ title, value }: { title: string; value: string }) {
  return <View style={styles.setting}><View><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingValue}>{value}</Text></View><Text style={styles.chevron}>›</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  profileHeader: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xl },
  profileText: { flex: 1, marginLeft: spacing.md },
  name: { color: colors.ink, fontSize: 24, fontWeight: '700' },
  location: { color: colors.muted, fontSize: type.small, marginTop: 4 },
  stats: { backgroundColor: colors.paper, borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, flexDirection: 'row', marginTop: spacing.xl, paddingVertical: spacing.lg },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.greenDark, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 5 },
  sectionTitle: { color: colors.ink, fontSize: type.title, fontWeight: '700', marginTop: spacing.xl },
  settings: { borderColor: colors.line, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.md, overflow: 'hidden' },
  setting: { alignItems: 'center', backgroundColor: colors.paper, borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  settingTitle: { color: colors.ink, fontSize: type.body, fontWeight: '600' },
  settingValue: { color: colors.muted, fontSize: type.small, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 26 },
  identityCard: { backgroundColor: colors.sageSoft, borderRadius: radius.lg, gap: spacing.md, marginTop: spacing.xl, padding: spacing.lg },
  identityTitle: { color: colors.greenDark, fontSize: type.title, fontWeight: '700' },
  identityText: { color: colors.muted, fontSize: type.small, lineHeight: 20 },
});
