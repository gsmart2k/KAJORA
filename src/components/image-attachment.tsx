import { useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Button } from '@/components/ui';
import { imageBytes } from '@/lib/image-bytes';
import { signGroupImage, uploadGroupImage } from '@/lib/supabase-rest';
import { useAuth } from '@/state/auth-context';
import { useKajora } from '@/state/kajora-context';
import { colors, radius, spacing } from '@/theme';

type Selected = { uri: string; bytes: ArrayBuffer; path: string };
export function ImageAttachment({ groupId }: { groupId: string }) {
  const { supabaseSession } = useAuth();
  const { sendGroupMessage } = useKajora();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const uploadStatus = useRef({ attempted: false, uploaded: false });
  const pick = async (camera: boolean) => {
    if (!supabaseSession || busy) return;
    setError(''); setBusy(true);
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { setError('Allow camera access in your device settings, or choose an existing photo.'); return; }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1, exif: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      setBusy(true);
      const asset = result.assets[0];
      if ((asset.fileSize ?? 0) > 25 * 1024 * 1024) throw new Error('Choose a photo smaller than 25 MB.');
      const context = ImageManipulator.manipulate(asset.uri);
      if (Math.max(asset.width, asset.height) > 2400) context.resize(asset.width >= asset.height ? { width: 2400 } : { height: 2400 });
      const image = await context.renderAsync();
      const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9, base64: true });
      if (!saved.base64) throw new Error('Could not prepare the photo. Try another image.');
      const bytes = imageBytes(saved.base64);
      if (bytes.byteLength > 5 * 1024 * 1024) throw new Error('The prepared photo is over 5 MB. Choose a smaller image.');
      setSelected({ uri: saved.uri, bytes, path: `${groupId}/${supabaseSession.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg` });
      uploadStatus.current = { attempted: false, uploaded: false };
      setProgress(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not open your photo.'); }
    finally { setBusy(false); }
  };
  const send = async () => {
    if (!selected || !supabaseSession || sending.current) return;
    sending.current = true; setBusy(true); setError('');
    try {
      // An interrupted upload may already have reached Storage. Check before retrying.
      if (uploadStatus.current.attempted && !uploadStatus.current.uploaded) {
        try { await signGroupImage(supabaseSession, selected.path); uploadStatus.current.uploaded = true; } catch { /* Retry upload. */ }
      }
      if (!uploadStatus.current.uploaded) {
        uploadStatus.current.attempted = true; setProgress(0);
        await uploadGroupImage(supabaseSession, selected.path, selected.bytes, setProgress);
        uploadStatus.current.uploaded = true;
      }
      setProgress(100);
      const sendError = await sendGroupMessage(groupId, caption, selected.path);
      if (sendError) throw new Error(sendError);
      setSelected(null); setCaption(''); setOpen(false); setProgress(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send. Your photo is ready to retry.'); }
    finally { setBusy(false); sending.current = false; }
  };
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Attach a photo" onPress={() => setOpen(true)} style={styles.attach}><Text style={styles.attachText}>＋</Text></Pressable>
    <Modal visible={open} onRequestClose={() => { if (!busy) setOpen(false); }} animationType="slide">
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Share a photo</Text>
        <Text style={styles.text}>Only approved group members can view this photo. Check that receipt details are readable before sending.</Text>
        <Button disabled={busy} variant="secondary" label="Choose photo" onPress={() => void pick(false)} />
        <Button disabled={busy} variant="secondary" label="Take photo" onPress={() => void pick(true)} />
        {selected ? <>
          <Image accessibilityLabel="Photo preview" source={{ uri: selected.uri }} style={styles.preview} resizeMode="contain" />
          <TextInput accessibilityLabel="Optional image caption" editable={!busy} value={caption} onChangeText={setCaption} maxLength={2000} multiline placeholder="Add a caption (optional)" placeholderTextColor={colors.muted} style={styles.input} />
          <Text style={styles.text}>Sharing a receipt does not verify a payment.</Text>
          {progress !== null && busy ? <Text accessibilityLiveRegion="polite" style={styles.text}>{progress === 100 ? 'Finishing send…' : `Uploading ${progress}%`}</Text> : null}
          <Button loading={busy} label={error ? 'Retry send' : 'Send photo'} onPress={() => void send()} />
          <Button disabled={busy} variant="quiet" label="Remove photo" onPress={() => { setSelected(null); setError(''); setProgress(null); }} />
        </> : busy ? <Text style={styles.text}>Preparing photo…</Text> : null}
        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
        <Button disabled={busy} variant="quiet" label="Back to chat" onPress={() => setOpen(false)} />
      </ScrollView>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  page: { padding: spacing.lg, paddingTop: 60, paddingBottom: 40, gap: spacing.md, backgroundColor: colors.canvas, flexGrow: 1 },
  title: { fontSize: 20, color: colors.ink, fontWeight: '700' },
  text: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 13 },
  preview: { width: '100%', height: 300, borderRadius: radius.md },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: spacing.md, color: colors.ink, minHeight: 60 },
  attach: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  attachText: { fontSize: 26, color: colors.greenDark },
});
