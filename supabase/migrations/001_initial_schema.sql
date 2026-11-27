-- ============================================================================
-- GNOME Desktop Portfolio — Supabase Initial Schema, Storage & UUID-Based RLS
-- ============================================================================
-- Security Model:
--   • Public (anon & authenticated): Read-only SELECT on projects, site_config,
--     and public media objects in storage bucket 'portfolio-media'.
--   • Admin (strictly auth.uid() present in public.app_admins): Full write
--     access (INSERT/UPDATE/DELETE). NEVER tied to email, so changing login
--     email via supabase.auth.updateUser({ email }) preserves permissions.
--   • public.app_admins has RLS enabled with ZERO client write policies —
--     only the Supabase SQL Editor (postgres / service_role) can assign admins.
-- ============================================================================

-- 1. Admin Registry (UUID-based, immutable from client APIs)
CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

-- Allow an authenticated user only to read their own membership row (no writes)
DROP POLICY IF EXISTS "app_admins_self_select" ON public.app_admins;
CREATE POLICY "app_admins_self_select"
  ON public.app_admins
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 2. Security Helper Function: public.is_admin()
-- Uses (SELECT auth.uid()) initPlan optimization & locked search_path.
-- Also callable via supabase.rpc('is_admin') from the frontend as a defense-in-depth check.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_admins
    WHERE user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 3. Automatic updated_at Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text NOT NULL CHECK (char_length(trim(title)) > 0),
  short_description text NOT NULL DEFAULT '',
  markdown_content  text NOT NULL DEFAULT '',
  thumbnail_url     text,
  link              text,
  category          text NOT NULL DEFAULT 'Featured',
  is_featured       boolean NOT NULL DEFAULT false,
  sort_order        integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_sort
  ON public.projects (sort_order ASC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_category
  ON public.projects (category);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_public_select" ON public.projects;
CREATE POLICY "projects_public_select"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "projects_admin_insert" ON public.projects;
CREATE POLICY "projects_admin_insert"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "projects_admin_update" ON public.projects;
CREATE POLICY "projects_admin_update"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "projects_admin_delete" ON public.projects;
CREATE POLICY "projects_admin_delete"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. Site Config Table (Singleton Row: id = 1)
CREATE TABLE IF NOT EXISTS public.site_config (
  id                 integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  wallpaper_url      text,
  boot_logo_url      text,
  screensaver_url    text,
  screensaver_type   text NOT NULL DEFAULT 'image'
                       CHECK (screensaver_type IN ('image', 'gif', 'video')),
  readme_content     text NOT NULL DEFAULT E'# Welcome to My GNOME Desktop Portfolio\n\nFeel free to explore this interactive desktop environment:\n\n- **Projects**: Browse featured work and read full Markdown case studies.\n- **User (About Me)**: Learn about my background, stack, and social links.\n- **Documents**: View or download my Resume / CV.\n- **Settings**: Customize light/dark style, accent colors, and animations.\n- **Top Bar**: Try Activities Overview, the live Calendar, Sleep Screensaver, or the GDM Lockscreen.\n',
  profile_name       text NOT NULL DEFAULT 'Portfolio Owner',
  profile_title      text NOT NULL DEFAULT 'Senior Full-Stack Engineer',
  profile_bio        text NOT NULL DEFAULT 'Building thoughtful web software, resilient cloud architectures, and crisp user interfaces.',
  profile_avatar_url text,
  tech_stack         jsonb NOT NULL DEFAULT '["React", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "Supabase"]'::jsonb,
  social_links       jsonb NOT NULL DEFAULT '{"github": "https://github.com/dnobstr", "linkedin": "", "email": ""}'::jsonb,
  resume_url         text,
  resume_filename    text NOT NULL DEFAULT 'Resume.pdf',
  updated_at         timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_site_config_updated_at ON public.site_config;
CREATE TRIGGER trg_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_config_public_select" ON public.site_config;
CREATE POLICY "site_config_public_select"
  ON public.site_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "site_config_admin_insert" ON public.site_config;
CREATE POLICY "site_config_admin_insert"
  ON public.site_config
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "site_config_admin_update" ON public.site_config;
CREATE POLICY "site_config_admin_update"
  ON public.site_config
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Note: No DELETE policy on site_config so the singleton row cannot be deleted via API.

-- Seed singleton config row
INSERT INTO public.site_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 6. Supabase Storage Bucket: portfolio-media (Public Read, Admin Write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-media',
  'portfolio-media',
  true,
  26214400, -- 25 MB limit (accommodates looping screensaver videos/GIFs)
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/markdown',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "portfolio_media_public_select" ON storage.objects;
CREATE POLICY "portfolio_media_public_select"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'portfolio-media');

DROP POLICY IF EXISTS "portfolio_media_admin_insert" ON storage.objects;
CREATE POLICY "portfolio_media_admin_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'portfolio-media' AND public.is_admin());

DROP POLICY IF EXISTS "portfolio_media_admin_update" ON storage.objects;
CREATE POLICY "portfolio_media_admin_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'portfolio-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'portfolio-media' AND public.is_admin());

DROP POLICY IF EXISTS "portfolio_media_admin_delete" ON storage.objects;
CREATE POLICY "portfolio_media_admin_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'portfolio-media' AND public.is_admin());
