import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

function nativeFile(key: string) {
  return new File(Paths.document, `${key.replace(/[^a-z0-9.-]/gi, '_')}.json`);
}

export async function readStoredJson<T>(key: string): Promise<T | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null;
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    }

    const file = nativeFile(key);
    if (!file.exists) return null;
    const value = await file.text();
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function writeStoredJson(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, serialized);
    return;
  }

  const file = nativeFile(key);
  if (!file.exists) file.create();
  file.write(serialized);
}

export async function removeStoredValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    return;
  }

  const file = nativeFile(key);
  if (file.exists) file.delete();
}
