# Supabase Setup & Security Checklist

Follow these steps in your Supabase Dashboard to connect this portfolio cleanly and lock down write access strictly to your Admin user UUID.

## 1. Run the Initial Migration

1. Open **SQL Editor** in your Supabase project.
2. Paste the contents of [`supabase/migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql) and click **Run**.
3. Confirm the following were created without errors:
   - Tables: `public.app_admins`, `public.projects`, `public.site_config` (seeded with row `id = 1`)
   - Function: `public.is_admin()`
   - Storage bucket: `portfolio-media` (public-read, admin-write)

## 2. Disable Public Signups (Required)

1. Go to **Authentication → Sign In / Providers → User Signups** (or **Authentication → Providers → Email**).
2. Toggle **OFF** **Allow new users to sign up** / **Enable Signups**.
3. Keep the **Email** provider enabled so your Admin account can authenticate via `signInWithPassword`.

## 3. Create Your Single Admin Account & Register Its UUID

1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter your Admin email and a strong password, check **Auto Confirm User**, and click **Create user**.
3. Copy the newly generated **User UID** (UUID).
4. Run this in the **SQL Editor**:

```sql
INSERT INTO public.app_admins (user_id)
VALUES ('YOUR-ADMIN-USER-UUID-HERE'::uuid)
ON CONFLICT (user_id) DO NOTHING;
```

> Because RLS validates `auth.uid()` against `public.app_admins` instead of comparing email strings, changing your Admin login email inside the in-OS Admin Panel will never break write permissions.

## 4. Configure Redirect URLs (For Admin Email Changes)

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to `https://dnobstr.github.io/portfolio/` (or your custom domain).
3. Under **Redirect URLs**, add:
   - `https://dnobstr.github.io/portfolio/**`
   - `http://localhost:5173/**`

## 5. Configure Local & GitHub Actions Environment Variables

- **Local development:** Copy `.env.example` to `.env.local` and paste your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **GitHub Pages CI/CD:** In GitHub **Settings → Secrets and variables → Actions**, add:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- In GitHub **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.

## 6. Security Verification

- Unauthenticated visitors can read `projects`, `site_config`, and `portfolio-media` objects.
- Unauthenticated `INSERT` / `UPDATE` / `DELETE` requests to any table or storage bucket fail with RLS violation.
- Calling `supabase.auth.signUp()` fails because public signups are disabled.
- Even if another user account existed in `auth.users`, writes would still be rejected unless their UUID was explicitly added to `public.app_admins` via the SQL Editor.
