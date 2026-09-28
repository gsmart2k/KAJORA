import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { readStoredJson, removeStoredValue, writeStoredJson } from '@/lib/storage';
import {
  fetchProfile,
  isSupabaseConfigured,
  restoreSupabaseSession,
  sendPhoneOtp,
  signOutSupabase,
  type SupabaseSession,
  updateProfile,
  verifyPhoneOtp,
} from '@/lib/supabase-rest';

const DEMO_SESSION_KEY = 'kajora.demo.session.v2';
export const TEST_OTP = '2468';

export type KajoraSession = {
  userId: string;
  phone: string;
  name: string;
  location: string;
  profileComplete: boolean;
  mode: 'demo' | 'supabase';
};

type AuthContextValue = {
  backendMode: 'demo' | 'supabase';
  isLoading: boolean;
  pendingPhone: string;
  session: KajoraSession | null;
  supabaseSession: SupabaseSession | null;
  beginPhoneSignIn: (phone: string) => Promise<string | null>;
  verifyOtp: (code: string) => Promise<string | null>;
  completeProfile: (details: Pick<KajoraSession, 'name' | 'location'>) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function sessionFromProfile(remote: SupabaseSession, profile: Awaited<ReturnType<typeof fetchProfile>>): KajoraSession {
  const profileComplete = Boolean(
    profile?.discovery_area && profile.display_name && profile.display_name !== 'New member',
  );
  return {
    location: profile?.discovery_area ?? 'Osogbo, Osun State',
    mode: 'supabase',
    name: profileComplete ? profile?.display_name ?? '' : '',
    phone: remote.user.phone ?? '',
    profileComplete,
    userId: remote.user.id,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const backendMode = isSupabaseConfigured ? 'supabase' : 'demo';
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState('');
  const [session, setSession] = useState<KajoraSession | null>(null);
  const [supabaseSession, setSupabaseSession] = useState<SupabaseSession | null>(null);

  useEffect(() => {
    let mounted = true;

    async function restore() {
      try {
        if (isSupabaseConfigured) {
          const remote = await restoreSupabaseSession();
          if (!remote || !mounted) return;
          const profile = await fetchProfile(remote);
          if (!mounted) return;
          setSupabaseSession(remote);
          setSession(sessionFromProfile(remote, profile));
          return;
        }

        const stored = await readStoredJson<KajoraSession>(DEMO_SESSION_KEY);
        if (stored && mounted) setSession(stored);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void restore();
    return () => {
      mounted = false;
    };
  }, []);

  const beginPhoneSignIn = useCallback(async (phone: string) => {
    setPendingPhone(phone);
    if (!isSupabaseConfigured) return null;
    try {
      await sendPhoneOtp(phone);
      return null;
    } catch (error) {
      return errorMessage(error);
    }
  }, []);

  const verifyOtp = useCallback(
    async (code: string) => {
      if (!pendingPhone) return 'Enter your phone number again.';

      if (!isSupabaseConfigured) {
        if (code !== TEST_OTP) return 'That prototype code is not correct.';
        const nextSession: KajoraSession = {
          location: 'Osogbo, Osun State',
          mode: 'demo',
          name: '',
          phone: pendingPhone,
          profileComplete: false,
          userId: 'demo-current-user',
        };
        setSession(nextSession);
        await writeStoredJson(DEMO_SESSION_KEY, nextSession);
        return null;
      }

      try {
        const remote = await verifyPhoneOtp(pendingPhone, code);
        const profile = await fetchProfile(remote);
        setSupabaseSession(remote);
        setSession(sessionFromProfile(remote, profile));
        return null;
      } catch (error) {
        return errorMessage(error);
      }
    },
    [pendingPhone],
  );

  const completeProfile = useCallback(
    async (details: Pick<KajoraSession, 'name' | 'location'>) => {
      if (isSupabaseConfigured) {
        if (!supabaseSession) return 'Your session expired. Please sign in again.';
        try {
          await updateProfile(supabaseSession, details);
        } catch (error) {
          return errorMessage(error);
        }
      }

      if (!session) return 'Your session expired. Please sign in again.';
      const nextSession: KajoraSession = { ...session, ...details, profileComplete: true };
      setSession(nextSession);
      if (nextSession.mode === 'demo') await writeStoredJson(DEMO_SESSION_KEY, nextSession);
      return null;
    },
    [session, supabaseSession],
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await signOutSupabase(supabaseSession);
    else await removeStoredValue(DEMO_SESSION_KEY);
    setSession(null);
    setSupabaseSession(null);
    setPendingPhone('');
  }, [supabaseSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      backendMode,
      beginPhoneSignIn,
      completeProfile,
      isLoading,
      pendingPhone,
      session,
      signOut,
      supabaseSession,
      verifyOtp,
    }),
    [backendMode, beginPhoneSignIn, completeProfile, isLoading, pendingPhone, session, signOut, supabaseSession, verifyOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
