import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'kajora.prototype.session';
export const TEST_OTP = '2468';

export type KajoraSession = {
  phone: string;
  name: string;
  location: string;
  profileComplete: boolean;
};

type AuthContextValue = {
  isLoading: boolean;
  pendingPhone: string;
  session: KajoraSession | null;
  beginPhoneSignIn: (phone: string) => void;
  verifyOtp: (code: string) => boolean;
  completeProfile: (details: Pick<KajoraSession, 'name' | 'location'>) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(session: KajoraSession | null) {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;

  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPhone, setPendingPhone] = useState('');
  const [session, setSession] = useState<KajoraSession | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setSession(JSON.parse(stored) as KajoraSession);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const beginPhoneSignIn = useCallback((phone: string) => {
    setPendingPhone(phone);
  }, []);

  const verifyOtp = useCallback(
    (code: string) => {
      if (code !== TEST_OTP || !pendingPhone) return false;

      const nextSession: KajoraSession = {
        phone: pendingPhone,
        name: '',
        location: 'Osogbo, Osun State',
        profileComplete: false,
      };
      setSession(nextSession);
      persistSession(nextSession);
      return true;
    },
    [pendingPhone],
  );

  const completeProfile = useCallback((details: Pick<KajoraSession, 'name' | 'location'>) => {
    setSession((current) => {
      if (!current) return current;
      const nextSession = { ...current, ...details, profileComplete: true };
      persistSession(nextSession);
      return nextSession;
    });
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    setPendingPhone('');
    persistSession(null);
  }, []);

  const value = useMemo(
    () => ({ isLoading, pendingPhone, session, beginPhoneSignIn, verifyOtp, completeProfile, signOut }),
    [beginPhoneSignIn, completeProfile, isLoading, pendingPhone, session, signOut, verifyOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
