import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface SignInResult {
  ok: boolean;
  error?: string;
}

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  signInAsAdmin: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function checkAdminMembership(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return Boolean(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    async function syncSession(nextUser: User | null) {
      if (cancelled) return;
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }

      const verified = await checkAdminMembership();
      if (!cancelled) {
        setIsAdmin(verified);
        setAuthLoading(false);
      }
    }

    void supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signInAsAdmin = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (!supabase || !isSupabaseConfigured) {
        return {
          ok: false,
          error: 'Supabase is not configured in this environment.',
        };
      }

      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        return {
          ok: false,
          error: 'Please enter both email and password.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error || !data.user) {
        return {
          ok: false,
          error: error?.message ?? 'Invalid credentials.',
        };
      }

      const verified = await checkAdminMembership();
      if (!verified) {
        await supabase.auth.signOut();
        setUser(null);
        setIsAdmin(false);
        return {
          ok: false,
          error: 'This account is not authorized as an administrator.',
        };
      }

      setUser(data.user);
      setIsAdmin(true);
      return { ok: true };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin,
      authLoading,
      signInAsAdmin,
      signOut,
    }),
    [user, isAdmin, authLoading, signInAsAdmin, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
