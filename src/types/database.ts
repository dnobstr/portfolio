export type ScreensaverType = 'image' | 'gif' | 'video';

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  email?: string;
  website?: string;
}

export interface Project {
  id: string;
  title: string;
  short_description: string;
  markdown_content: string;
  thumbnail_url: string | null;
  link: string | null;
  category: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type ProjectInsert = {
  title: string;
  short_description?: string;
  markdown_content?: string;
  thumbnail_url?: string | null;
  link?: string | null;
  category?: string;
  is_featured?: boolean;
  sort_order?: number;
};

export type ProjectUpdate = Partial<ProjectInsert>;

export interface SiteConfig {
  id: number;
  wallpaper_url: string | null;
  boot_logo_url: string | null;
  screensaver_url: string | null;
  screensaver_type: ScreensaverType;
  readme_content: string;
  profile_name: string;
  profile_title: string;
  profile_bio: string;
  profile_avatar_url: string | null;
  tech_stack: string[];
  social_links: SocialLinks;
  resume_url: string | null;
  resume_filename: string;
  updated_at: string;
}

export type SiteConfigUpdate = Partial<Omit<SiteConfig, 'id' | 'updated_at'>>;
