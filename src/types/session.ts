export type SessionState =
  | 'booting'
  | 'desktop'
  | 'locked'
  | 'sleeping'
  | 'shutdown';

export type LockMode = 'guest' | 'admin';

export type ThemeMode = 'dark' | 'light';

export type AccentColorId =
  | 'blue'
  | 'teal'
  | 'green'
  | 'orange'
  | 'red'
  | 'purple'
  | 'slate';

export interface ThemePreferences {
  mode: ThemeMode;
  accent: AccentColorId;
  animationsEnabled: boolean;
}
