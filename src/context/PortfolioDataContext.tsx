import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_PROJECTS, DEFAULT_SITE_CONFIG } from '../lib/defaults';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Project, SiteConfig, SocialLinks } from '../types/database';

interface PortfolioDataContextValue {
  siteConfig: SiteConfig;
  projects: Project[];
  loading: boolean;
  error: string | null;
  isUsingDefaults: boolean;
  refreshData: () => Promise<void>;
}

const PortfolioDataContext = createContext<PortfolioDataContextValue | null>(
  null
);

function normalizeSiteConfig(raw: Partial<SiteConfig> | null): SiteConfig {
  if (!raw) return DEFAULT_SITE_CONFIG;

  const techStack = Array.isArray(raw.tech_stack)
    ? raw.tech_stack.filter((item): item is string => typeof item === 'string')
    : DEFAULT_SITE_CONFIG.tech_stack;

  const socialLinks: SocialLinks =
    raw.social_links && typeof raw.social_links === 'object'
      ? {
          ...DEFAULT_SITE_CONFIG.social_links,
          ...raw.social_links,
        }
      : DEFAULT_SITE_CONFIG.social_links;

  return {
    ...DEFAULT_SITE_CONFIG,
    ...raw,
    tech_stack: techStack,
    social_links: socialLinks,
  };
}

export function PortfolioDataProvider({ children }: { children: ReactNode }) {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [isUsingDefaults, setIsUsingDefaults] = useState<boolean>(
    !isSupabaseConfigured
  );

  const refreshData = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setSiteConfig(DEFAULT_SITE_CONFIG);
      setProjects(DEFAULT_PROJECTS);
      setIsUsingDefaults(true);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [configResponse, projectsResponse] = await Promise.all([
        supabase.from('site_config').select('*').eq('id', 1).maybeSingle(),
        supabase
          .from('projects')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false }),
      ]);

      if (configResponse.error || projectsResponse.error) {
        const message =
          configResponse.error?.message ??
          projectsResponse.error?.message ??
          'Failed to fetch portfolio data';
        setError(message);
        setIsUsingDefaults(true);
        return;
      }

      const nextConfig = normalizeSiteConfig(
        configResponse.data as Partial<SiteConfig> | null
      );
      const nextProjects = (projectsResponse.data as Project[] | null) ?? [];

      setSiteConfig(nextConfig);
      setProjects(nextProjects.length > 0 ? nextProjects : DEFAULT_PROJECTS);
      setIsUsingDefaults(!configResponse.data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unexpected network error loading portfolio data'
      );
      setIsUsingDefaults(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const value = useMemo<PortfolioDataContextValue>(
    () => ({
      siteConfig,
      projects,
      loading,
      error,
      isUsingDefaults,
      refreshData,
    }),
    [siteConfig, projects, loading, error, isUsingDefaults, refreshData]
  );

  return (
    <PortfolioDataContext.Provider value={value}>
      {children}
    </PortfolioDataContext.Provider>
  );
}

export function usePortfolioData(): PortfolioDataContextValue {
  const context = useContext(PortfolioDataContext);
  if (!context) {
    throw new Error(
      'usePortfolioData must be used within a PortfolioDataProvider'
    );
  }
  return context;
}
