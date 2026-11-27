import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ADWAITA_ACCENTS } from '../lib/adwaita';
import type {
  AccentColorId,
  ThemeMode,
  ThemePreferences,
  WidgetThemeId,
} from '../types/session';

const STORAGE_KEY = 'gnome-portfolio:theme-preferences';

const VALID_ACCENTS = new Set<AccentColorId>(
  ADWAITA_ACCENTS.map((swatch) => swatch.id)
);

export const WIDGET_THEMES: ReadonlyArray<{
  id: WidgetThemeId;
  label: string;
  description: string;
}> = [
  {
    id: 'adwaita',
    label: 'Libadwaita Native',
    description: 'Adapts to GNOME light/dark theme and active accent color',
  },
  {
    id: 'kde-glass',
    label: 'KDE Glass',
    description: 'Translucent dark glass with vibrant multi-color progress bars',
  },
  {
    id: 'terminal',
    label: 'Terminal HUD',
    description: 'Monospace typography with segmented block meters',
  },
  {
    id: 'conky',
    label: 'Minimal Conky',
    description: 'Borderless floating overlay directly over the wallpaper',
  },
  {
    id: 'nordic',
    label: 'Nordic Frost',
    description: 'Cool slate-blue frosted glass with muted aurora accents',
  },
];

const VALID_WIDGET_THEMES = new Set<WidgetThemeId>(
  WIDGET_THEMES.map((theme) => theme.id)
);

function getDefaultPreferences(): ThemePreferences {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    mode: 'dark',
    accent: 'blue',
    animationsEnabled: !prefersReducedMotion,
    widgetTheme: 'adwaita',
    showSystemWidget: true,
  };
}

function loadStoredPreferences(): ThemePreferences {
  const defaults = getDefaultPreferences();
  if (typeof window === 'undefined') return defaults;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ThemePreferences>;

    const mode: ThemeMode =
      parsed.mode === 'light' || parsed.mode === 'dark'
        ? parsed.mode
        : defaults.mode;
    const accent: AccentColorId =
      parsed.accent && VALID_ACCENTS.has(parsed.accent)
        ? parsed.accent
        : defaults.accent;
    const animationsEnabled =
      typeof parsed.animationsEnabled === 'boolean'
        ? parsed.animationsEnabled
        : defaults.animationsEnabled;
    const widgetTheme: WidgetThemeId =
      parsed.widgetTheme && VALID_WIDGET_THEMES.has(parsed.widgetTheme)
        ? parsed.widgetTheme
        : defaults.widgetTheme;
    const showSystemWidget =
      typeof parsed.showSystemWidget === 'boolean'
        ? parsed.showSystemWidget
        : defaults.showSystemWidget;

    return {
      mode,
      accent,
      animationsEnabled,
      widgetTheme,
      showSystemWidget,
    };
  } catch {
    return defaults;
  }
}

interface ThemeContextValue extends ThemePreferences {
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setAccent: (accent: AccentColorId) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  toggleAnimations: () => void;
  setWidgetTheme: (theme: WidgetThemeId) => void;
  cycleWidgetTheme: () => void;
  setShowSystemWidget: (visible: boolean) => void;
  toggleSystemWidget: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<ThemePreferences>(
    loadStoredPreferences
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.mode);
  }, [preferences.mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', preferences.accent);
  }, [preferences.accent]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage quota or private-browsing write failures
    }
  }, [preferences]);

  const setMode = useCallback((mode: ThemeMode) => {
    setPreferences((previous) => ({ ...previous, mode }));
  }, []);

  const toggleMode = useCallback(() => {
    setPreferences((previous) => ({
      ...previous,
      mode: previous.mode === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const setAccent = useCallback((accent: AccentColorId) => {
    setPreferences((previous) => ({ ...previous, accent }));
  }, []);

  const setAnimationsEnabled = useCallback((animationsEnabled: boolean) => {
    setPreferences((previous) => ({ ...previous, animationsEnabled }));
  }, []);

  const toggleAnimations = useCallback(() => {
    setPreferences((previous) => ({
      ...previous,
      animationsEnabled: !previous.animationsEnabled,
    }));
  }, []);

  const setWidgetTheme = useCallback((widgetTheme: WidgetThemeId) => {
    setPreferences((previous) => ({ ...previous, widgetTheme }));
  }, []);

  const cycleWidgetTheme = useCallback(() => {
    setPreferences((previous) => {
      const currentIndex = WIDGET_THEMES.findIndex(
        (item) => item.id === previous.widgetTheme
      );
      const nextTheme =
        WIDGET_THEMES[(currentIndex + 1) % WIDGET_THEMES.length].id;
      return { ...previous, widgetTheme: nextTheme };
    });
  }, []);

  const setShowSystemWidget = useCallback((showSystemWidget: boolean) => {
    setPreferences((previous) => ({ ...previous, showSystemWidget }));
  }, []);

  const toggleSystemWidget = useCallback(() => {
    setPreferences((previous) => ({
      ...previous,
      showSystemWidget: !previous.showSystemWidget,
    }));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...preferences,
      setMode,
      toggleMode,
      setAccent,
      setAnimationsEnabled,
      toggleAnimations,
      setWidgetTheme,
      cycleWidgetTheme,
      setShowSystemWidget,
      toggleSystemWidget,
    }),
    [
      preferences,
      setMode,
      toggleMode,
      setAccent,
      setAnimationsEnabled,
      toggleAnimations,
      setWidgetTheme,
      cycleWidgetTheme,
      setShowSystemWidget,
      toggleSystemWidget,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
