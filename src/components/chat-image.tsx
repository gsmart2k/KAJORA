import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { signGroupImage } from '@/lib/supabase-rest';
import { useAutoRefresh } from '@/lib/use-auto-refresh';
import { useAuth } from '@/state/auth-context';
import { colors, spacing } from '@/theme';

export function ChatImage({ path, focused }: { path: string; focused: boolean }) {
  const { supabaseSession } = useAuth();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const expires = useRef(0);
  const renew = useCallback(async () => {
    if (!supabaseSession) return;
    try {
      const next = await signGroupImage(supabaseSession, path);
      expires.current = Date.now() + 45000;
      setUrl(next); setError('');
    } catch {
      setUrl(''); setError('Image unavailable. Tap to retry.');
    }
  }, [path, supabaseSession]);
  useEffect(() => {
    if (!supabaseSession || !focused) return;
    let active = true;
    void signGroupImage(supabaseSession, path).then((next) => {
      if (active) { setUrl(next); setError(''); expires.current = Date.now() + 45000; }
    }).catch(() => { if (active) { setUrl(''); setError('Image unavailable. Tap to retry.'); } });
    return () => { active = false; };
  }, [path, supabaseSession, focused]);
  useAutoRefresh(async () => { if (Date.now() >= expires.current) await renew(); }, focused);
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel="Open shared photo" onPress={() => { if (error) void renew(); else setOpen(true); }}>
      {url ? <Image source={{ uri: url }} resizeMode="contain" style={styles.thumbnail} onError={() => setError('Image unavailable. Tap to retry.')} /> : <Text style={styles.text}>{error || 'Loading image…'}</Text>}
      {url && error ? <Text style={styles.text}>{error}</Text> : null}
    </Pressable>
    <Modal visible={open && focused} onRequestClose={() => setOpen(false)} animationType="fade">
      <View style={styles.viewer}>
        <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}><Text style={styles.text}>Close photo</Text></Pressable>
        {url ? <Image accessibilityLabel="Shared group photo" source={{ uri: url }} resizeMode="contain" style={styles.full} /> : <Text style={styles.text}>{error}</Text>}
      </View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  thumbnail: { width: 210, height: 210, maxWidth: '100%' },
  viewer: { flex: 1, backgroundColor: colors.canvas, paddingTop: 48, paddingBottom: 30 },
  full: { flex: 1, width: '100%' },
  close: { padding: spacing.lg, alignSelf: 'flex-end' },
  text: { color: colors.ink, fontSize: 13, padding: spacing.sm },
});
