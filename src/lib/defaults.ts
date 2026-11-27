import type { Project, SiteConfig } from '../types/database';

const BASE = import.meta.env.BASE_URL || '/';

export const DEFAULT_WALLPAPER_URL = `${BASE}defaults/default-wallpaper.svg`;
export const DEFAULT_BOOT_LOGO_URL = `${BASE}defaults/default-boot-logo.svg`;

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 1,
  wallpaper_url: DEFAULT_WALLPAPER_URL,
  boot_logo_url: DEFAULT_BOOT_LOGO_URL,
  screensaver_url: null,
  screensaver_type: 'image',
  readme_content: `# Welcome to My GNOME Desktop Portfolio

Feel free to explore this interactive desktop environment:

- **Projects**: Browse featured work and read full Markdown case studies.
- **User (About Me)**: Learn about my background, stack, and social links.
- **Documents**: View or download my Resume / CV.
- **Settings**: Customize light/dark style, accent colors, and animations.
- **Top Bar**: Try **Activities**, the live **Calendar**, **Sleep** screensaver, or the **GDM Lockscreen** (Admin login is available via Switch User).
`,
  profile_name: 'Portfolio Owner',
  profile_title: 'Senior Full-Stack Engineer',
  profile_bio:
    'Designing and shipping resilient web systems, crisp developer tools, and thoughtful user interfaces.',
  profile_avatar_url: null,
  tech_stack: [
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Framer Motion',
    'PostgreSQL',
    'Supabase',
  ],
  social_links: {
    github: 'https://github.com/dnobstr',
    linkedin: '',
    email: '',
  },
  resume_url: null,
  resume_filename: 'Resume.pdf',
  updated_at: new Date().toISOString(),
};

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'demo-gnome-shell',
    title: 'Adwaita Desktop Environment',
    short_description:
      'An interactive GNOME-inspired web portfolio with a draggable window manager, Supabase RLS CMS, and GDM session lifecycle.',
    markdown_content: `## Overview

A modern portfolio modeled after the **GNOME Desktop Environment** and **Libadwaita** design language.

### Key Architecture Highlights

- **Window Manager**: Pointer-captured dragging, 8-way resizing, z-index focus stack, and responsive mobile fallback.
- **Security**: PostgreSQL Row Level Security anchored strictly to the admin user's \`auth.uid()\` UUID.
- **Session Lifecycle**: Plymouth boot screen, GDM lockscreen with Guest & Admin switching, screensaver sleep, and shutdown sequence.
`,
    thumbnail_url: DEFAULT_WALLPAPER_URL,
    link: 'https://github.com/dnobstr/portfolio',
    category: 'Featured',
    is_featured: true,
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
