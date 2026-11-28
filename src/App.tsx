import { MotionConfig } from 'framer-motion';
import {
  CheckCircle2,
  Database,
  Layers,
  Moon,
  Shield,
  Sun,
  TriangleAlert,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  PortfolioDataProvider,
  usePortfolioData,
} from './context/PortfolioDataContext';
import { SessionProvider, useSession } from './context/SessionContext';
import { ThemeProvider, useTheme, WIDGET_THEMES } from './context/ThemeContext';
import {
  useWindowManager,
  WindowManagerProvider,
} from './context/WindowManagerContext';
import { ADWAITA_ACCENTS } from './lib/adwaita';
import { DEFAULT_WALLPAPER_URL } from './lib/defaults';
import { sanitizeExternalUrl } from './lib/format';

function DesktopRoot() {
  const {
    mode,
    accent,
    animationsEnabled,
    widgetTheme,
    toggleMode,
    setAccent,
    cycleWidgetTheme,
  } = useTheme();
  const { siteConfig, projects, loading, error, isUsingDefaults } =
    usePortfolioData();
  const { isAdmin, authLoading } = useAuth();
  const { sessionState } = useSession();
  const { openWindows, openApp, closeAll } = useWindowManager();

  const wallpaperUrl =
    sanitizeExternalUrl(siteConfig.wallpaper_url) ?? DEFAULT_WALLPAPER_URL;
  const activeWidgetThemeLabel =
    WIDGET_THEMES.find((item) => item.id === widgetTheme)?.label ?? widgetTheme;

  return (
    <MotionConfig reducedMotion={animationsEnabled ? 'user' : 'always'}>
      <div
        className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center p-6"
        style={{ backgroundImage: `url(${wallpaperUrl})` }}
      >
        <div className="adw-window w-full max-w-xl overflow-hidden rounded-2xl shadow-[var(--adw-window-shadow)]">
          <header
            className="flex h-12 items-center justify-between border-b px-4"
            style={{
              backgroundColor: 'var(--adw-header-bg)',
              borderColor: 'var(--adw-border)',
            }}
          >
            <span className="text-sm font-semibold tracking-tight">
              GNOME Portfolio — Phase 2.0.1 Core Providers
            </span>
            <button
              type="button"
              onClick={toggleMode}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{ backgroundColor: 'var(--adw-pill-bg)' }}
            >
              {mode === 'dark' ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
              {mode === 'dark' ? 'Light' : 'Dark'}
            </button>
          </header>

          <main className="space-y-4 p-6">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-tight">
                Core Context Stack Ready
              </h1>
              <p
                className="text-sm"
                style={{ color: 'var(--adw-fg-secondary)' }}
              >
                Theme, Portfolio Data, Auth, Session, and Window Manager
                contexts are mounted and ready for Phase 2.0.2 shell chrome.
              </p>
            </div>

            <section className="adw-surface space-y-2 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                {error ? (
                  <TriangleAlert
                    className="h-4 w-4"
                    style={{ color: 'var(--adw-warning)' }}
                  />
                ) : loading ? (
                  <Database
                    className="h-4 w-4"
                    style={{ color: 'var(--adw-accent)' }}
                  />
                ) : (
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: 'var(--adw-success)' }}
                  />
                )}
                <span>
                  Portfolio Data:{' '}
                  {loading
                    ? 'LOADING'
                    : isUsingDefaults
                      ? 'LOCAL DEFAULTS'
                      : 'SUPABASE LIVE'}
                </span>
              </div>
              <p
                className="font-mono text-xs"
                style={{ color: 'var(--adw-fg-muted)' }}
              >
                profile: {siteConfig.profile_name} · projects: {projects.length}{' '}
                · session: {sessionState}
              </p>
              {error && (
                <p
                  className="text-xs"
                  style={{ color: 'var(--adw-warning)' }}
                >
                  {error}
                </p>
              )}
            </section>

            <section className="adw-surface grid grid-cols-2 gap-3 rounded-xl p-4 text-xs">
              <div className="flex items-center gap-2">
                <Shield
                  className="h-4 w-4 shrink-0"
                  style={{ color: 'var(--adw-accent)' }}
                />
                <span style={{ color: 'var(--adw-fg-secondary)' }}>
                  Auth:{' '}
                  {authLoading ? 'Checking…' : isAdmin ? 'Admin' : 'Guest'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layers
                  className="h-4 w-4 shrink-0"
                  style={{ color: 'var(--adw-accent)' }}
                />
                <span style={{ color: 'var(--adw-fg-secondary)' }}>
                  Open Windows: {openWindows.length}
                </span>
              </div>
            </section>

            <section className="adw-surface space-y-3 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Accent &amp; Widget Theme
                </span>
                <button
                  type="button"
                  onClick={cycleWidgetTheme}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--adw-accent)' }}
                >
                  Widget: {activeWidgetThemeLabel}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {ADWAITA_ACCENTS.map((swatch) => (
                    <button
                      key={swatch.id}
                      type="button"
                      aria-label={`Select ${swatch.label} accent`}
                      onClick={() => setAccent(swatch.id)}
                      className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: swatch.hex,
                        outline:
                          accent === swatch.id
                            ? '2px solid var(--adw-fg)'
                            : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openApp('projects')}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: 'var(--adw-pill-bg)' }}
                  >
                    Test Open App
                  </button>
                  {openWindows.length > 0 && (
                    <button
                      type="button"
                      onClick={closeAll}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: 'var(--adw-pill-bg)' }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PortfolioDataProvider>
        <AuthProvider>
          <SessionProvider>
            <WindowManagerProvider>
              <DesktopRoot />
            </WindowManagerProvider>
          </SessionProvider>
        </AuthProvider>
      </PortfolioDataProvider>
    </ThemeProvider>
  );
}
