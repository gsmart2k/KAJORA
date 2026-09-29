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
  signInWithEmailPassword,
  signOutSupabase,
  signUpWithEmailPassword,
  type SupabaseSession,
  updateProfile,
} from '@/lib/supabase-rest';

const DEMO_SESSION_KEY = 'kajora.demo.session.v3';

export type EmailAuthAction = 'sign-in' | 'sign-up';

export type KajoraSession = {
  userId: string;
  email: string;
  name: string;
  location: string;
  profileComplete: boolean;
  mode: 'demo' | 'supabase';
};

type AuthContextValue = {
  backendMode: 'demo' | 'supabase';
  isLoading: boolean;
  session: KajoraSession | null;
  supabaseSession: SupabaseSession | null;
  authenticateWithEmail: (email: string, password: string, action: EmailAuthAction) => Promise<string | null>;
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
    email: remote.user.email ?? '',
    location: profile?.discovery_area ?? 'Osogbo, Osun State',
    mode: 'supabase',
    name: profileComplete ? profile?.display_name ?? '' : '',
    profileComplete,
    userId: remote.user.id,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const backendMode = isSupabaseConfigured ? 'supabase' : 'demo';
  const [isLoading, setIsLoading] = useState(true);
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

  const authenticateWithEmail = useCallback(
    async (email: string, password: string, action: EmailAuthAction) => {
      if (!isSupabaseConfigured) {
        const nextSession: KajoraSession = {
          email,
          location: 'Osogbo, Osun State',
          mode: 'demo',
          name: '',
          profileComplete: false,
          userId: `demo-${email.toLowerCase()}`,
        };
        setSession(nextSession);
        await writeStoredJson(DEMO_SESSION_KEY, nextSession);
        return null;
      }

      try {
        const remote = action === 'sign-up'
          ? await signUpWithEmailPassword(email, password)
          : await signInWithEmailPassword(email, password);
        const profile = await fetchProfile(remote);
        setSupabaseSession(remote);
        setSession(sessionFromProfile(remote, profile));
        return null;
      } catch (error) {
        return errorMessage(error);
      }
    },
    [],
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
    try {
      if (isSupabaseConfigured) await signOutSupabase(supabaseSession);
      else await removeStoredValue(DEMO_SESSION_KEY);
    } finally {
      setSession(null);
      setSupabaseSession(null);
    }
  }, [supabaseSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticateWithEmail,
      backendMode,
      completeProfile,
      isLoading,
      session,
      signOut,
      supabaseSession,
    }),
    [authenticateWithEmail, backendMode, completeProfile, isLoading, session, signOut, supabaseSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
