import { useEffect, useState } from 'react';
import { CheckCircle2, Database, Moon, Sun, TriangleAlert } from 'lucide-react';
import { ADWAITA_ACCENTS } from './lib/adwaita';
import { DEFAULT_WALLPAPER_URL } from './lib/defaults';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type { AccentColorId, ThemeMode } from './types/session';

interface ConnectionStatus {
  state: 'checking' | 'connected' | 'unconfigured' | 'error';
  detail: string;
  projectCount?: number;
  hasSiteConfig?: boolean;
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [accent, setAccent] = useState<AccentColorId>('blue');
  const [status, setStatus] = useState<ConnectionStatus>({
    state: isSupabaseConfigured ? 'checking' : 'unconfigured',
    detail: isSupabaseConfigured
      ? 'Checking Supabase read connection...'
      : 'No .env.local configured yet — running with local default assets.',
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
  }, [accent]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    async function verifySupabase() {
      try {
        const [configRes, projectsRes] = await Promise.all([
          supabase!.from('site_config').select('id').eq('id', 1).maybeSingle(),
          supabase!.from('projects').select('id', { count: 'exact', head: true }),
        ]);

        if (cancelled) return;

        if (configRes.error || projectsRes.error) {
          const msg = configRes.error?.message ?? projectsRes.error?.message ?? 'Query failed';
          setStatus({
            state: 'error',
            detail: `Connected to Supabase URL, but migration may still be pending: ${msg}`,
          });
          return;
        }

        setStatus({
          state: 'connected',
          detail: 'Supabase PostgreSQL & RLS read connection verified.',
          hasSiteConfig: Boolean(configRes.data),
          projectCount: projectsRes.count ?? 0,
        });
      } catch (err) {
        if (cancelled) return;
        setStatus({
          state: 'error',
          detail: err instanceof Error ? err.message : 'Unexpected connection error',
        });
      }
    }

    void verifySupabase();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${DEFAULT_WALLPAPER_URL})` }}
    >
      <div className="adw-window w-full max-w-xl overflow-hidden rounded-2xl shadow-[var(--adw-window-shadow)]">
        {/* Adwaita Headerbar */}
        <header
          className="flex h-12 items-center justify-between border-b px-4"
          style={{
            backgroundColor: 'var(--adw-header-bg)',
            borderColor: 'var(--adw-border)',
          }}
        >
          <span className="text-sm font-semibold tracking-tight">
            GNOME Portfolio — Milestone 1 Foundation
          </span>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            style={{ backgroundColor: 'var(--adw-pill-bg)' }}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </header>

        {/* Body */}
        <main className="space-y-5 p-6">
          <div className="space-y-1.5">
            <h1 className="text-lg font-semibold tracking-tight">
              System Foundation Ready
            </h1>
            <p className="text-sm" style={{ color: 'var(--adw-fg-secondary)' }}>
              Vite + React + Tailwind v4 Adwaita tokens, GitHub Pages workflow, and
              Supabase UUID-RLS schema are in place.
            </p>
          </div>

          {/* Supabase Status Card */}
          <section className="adw-surface rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {status.state === 'connected' ? (
                <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--adw-success)' }} />
              ) : status.state === 'error' ? (
                <TriangleAlert className="h-4 w-4" style={{ color: 'var(--adw-warning)' }} />
              ) : (
                <Database className="h-4 w-4" style={{ color: 'var(--adw-accent)' }} />
              )}
              <span>Supabase Status: {status.state.toUpperCase()}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--adw-fg-secondary)' }}>
              {status.detail}
            </p>
            {status.state === 'connected' && (
              <p className="text-xs font-mono" style={{ color: 'var(--adw-fg-muted)' }}>
                site_config#1: {status.hasSiteConfig ? 'present' : 'missing'} · projects:{' '}
                {status.projectCount}
              </p>
            )}
          </section>

          {/* Accent Swatch Verification */}
          <section className="adw-surface rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Adwaita Accent Tokens</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: 'var(--adw-accent)' }}
              >
                {accent}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {ADWAITA_ACCENTS.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  aria-label={`Select ${swatch.label} accent`}
                  onClick={() => setAccent(swatch.id)}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: swatch.hex,
                    outline:
                      accent === swatch.id ? '2px solid var(--adw-fg)' : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
