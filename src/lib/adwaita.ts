import type { AccentColorId } from '../types/session';
import type { AppDefinition, AppId } from '../types/window';

export interface AccentSwatch {
  id: AccentColorId;
  label: string;
  hex: string;
}

export const ADWAITA_ACCENTS: AccentSwatch[] = [
  { id: 'blue', label: 'Blue', hex: '#3584e4' },
  { id: 'teal', label: 'Teal', hex: '#2190a4' },
  { id: 'green', label: 'Green', hex: '#3a944a' },
  { id: 'orange', label: 'Orange', hex: '#ed5b00' },
  { id: 'red', label: 'Red', hex: '#e62d42' },
  { id: 'purple', label: 'Purple', hex: '#9141ac' },
  { id: 'slate', label: 'Slate', hex: '#6f8396' },
];

export const GNOME_SPRING = {
  type: 'spring' as const,
  stiffness: 360,
  damping: 32,
  mass: 0.85,
};

export const GNOME_EASE = [0.22, 1, 0.36, 1] as const;

export const APP_REGISTRY: Record<AppId, AppDefinition> = {
  projects: {
    id: 'projects',
    name: 'Projects',
    shortName: 'Projects',
    description: 'Featured work, case studies, and engineering showcase',
    defaultWidth: 1020,
    defaultHeight: 660,
    minWidth: 520,
    minHeight: 400,
    pinnedInDock: true,
  },
  about: {
    id: 'about',
    name: 'User',
    shortName: 'About Me',
    description: 'Profile, bio, core stack, and contact links',
    defaultWidth: 740,
    defaultHeight: 560,
    minWidth: 440,
    minHeight: 380,
    pinnedInDock: true,
  },
  documents: {
    id: 'documents',
    name: 'Documents',
    shortName: 'Documents',
    description: 'Resume / CV viewer and portfolio files',
    defaultWidth: 820,
    defaultHeight: 600,
    minWidth: 460,
    minHeight: 380,
    pinnedInDock: true,
  },
  'text-editor': {
    id: 'text-editor',
    name: 'Text Editor',
    shortName: 'readme.txt',
    description: 'Read-only welcome notes and desktop guide',
    defaultWidth: 680,
    defaultHeight: 520,
    minWidth: 400,
    minHeight: 320,
    pinnedInDock: true,
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    shortName: 'Settings',
    description: 'Appearance, accent colors, animations, and session',
    defaultWidth: 780,
    defaultHeight: 540,
    minWidth: 460,
    minHeight: 380,
    pinnedInDock: true,
  },
  admin: {
    id: 'admin',
    name: 'Admin Panel',
    shortName: 'Admin',
    description: 'Manage projects, branding, readme.txt, and credentials',
    defaultWidth: 980,
    defaultHeight: 650,
    minWidth: 560,
    minHeight: 440,
    pinnedInDock: false,
    adminOnly: true,
  },
};

export const APP_LIST: AppDefinition[] = Object.values(APP_REGISTRY);
