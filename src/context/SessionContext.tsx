import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LockMode, SessionState } from '../types/session';

const BOOT_SESSION_KEY = 'gnome-portfolio:boot-completed';

function getInitialSessionState(): SessionState {
  if (typeof window === 'undefined') return 'desktop';
  try {
    return window.sessionStorage.getItem(BOOT_SESSION_KEY) === 'true'
      ? 'desktop'
      : 'booting';
  } catch {
    return 'booting';
  }
}

interface SessionContextValue {
  sessionState: SessionState;
  lockMode: LockMode;
  activitiesOpen: boolean;
  completeBoot: () => void;
  lock: (mode?: LockMode) => void;
  unlockToDesktop: () => void;
  sleep: () => void;
  wake: () => void;
  shutdown: () => void;
  powerOn: () => void;
  setActivitiesOpen: (open: boolean) => void;
  toggleActivities: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>(
    getInitialSessionState
  );
  const [lockMode, setLockMode] = useState<LockMode>('guest');
  const [activitiesOpen, setActivitiesOpen] = useState<boolean>(false);

  const completeBoot = useCallback(() => {
    try {
      window.sessionStorage.setItem(BOOT_SESSION_KEY, 'true');
    } catch {
      // Ignore sessionStorage restrictions
    }
    setSessionState('desktop');
  }, []);

  const lock = useCallback((mode: LockMode = 'guest') => {
    setActivitiesOpen(false);
    setLockMode(mode);
    setSessionState('locked');
  }, []);

  const unlockToDesktop = useCallback(() => {
    setSessionState('desktop');
  }, []);

  const sleep = useCallback(() => {
    setActivitiesOpen(false);
    setSessionState('sleeping');
  }, []);

  const wake = useCallback(() => {
    setSessionState('desktop');
  }, []);

  const shutdown = useCallback(() => {
    setActivitiesOpen(false);
    setSessionState('shutdown');
  }, []);

  const powerOn = useCallback(() => {
    setActivitiesOpen(false);
    setSessionState('booting');
  }, []);

  const toggleActivities = useCallback(() => {
    setActivitiesOpen((previous) => !previous);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      sessionState,
      lockMode,
      activitiesOpen,
      completeBoot,
      lock,
      unlockToDesktop,
      sleep,
      wake,
      shutdown,
      powerOn,
      setActivitiesOpen,
      toggleActivities,
    }),
    [
      sessionState,
      lockMode,
      activitiesOpen,
      completeBoot,
      lock,
      unlockToDesktop,
      sleep,
      wake,
      shutdown,
      powerOn,
      toggleActivities,
    ]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
