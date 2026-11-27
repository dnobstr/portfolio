export type AppId =
  | 'projects'
  | 'about'
  | 'documents'
  | 'text-editor'
  | 'settings'
  | 'admin';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowInstance extends WindowBounds {
  appId: AppId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  minWidth: number;
  minHeight: number;
  payload?: Record<string, unknown>;
}

export interface AppDefinition {
  id: AppId;
  name: string;
  shortName: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  pinnedInDock: boolean;
  adminOnly?: boolean;
}
