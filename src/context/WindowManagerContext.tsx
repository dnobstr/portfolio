import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { APP_LIST, APP_REGISTRY } from '../lib/adwaita';
import {
  clampWindowPosition,
  computeInitialBounds,
  type ViewportSize,
} from '../lib/windowLayout';
import type { AppId, WindowBounds, WindowInstance } from '../types/window';
import { useAuth } from './AuthContext';

const BASE_Z_INDEX = 20;

interface WindowManagerState {
  windows: Record<AppId, WindowInstance>;
  nextZIndex: number;
}

type WindowManagerAction =
  | {
      type: 'OPEN_APP';
      appId: AppId;
      viewport: ViewportSize;
      payload?: Record<string, unknown>;
    }
  | { type: 'CLOSE_APP'; appId: AppId }
  | { type: 'FOCUS_APP'; appId: AppId }
  | { type: 'MINIMIZE_APP'; appId: AppId }
  | { type: 'RESTORE_AND_FOCUS'; appId: AppId }
  | { type: 'TOGGLE_MAXIMIZE'; appId: AppId }
  | {
      type: 'MOVE_WINDOW';
      appId: AppId;
      x: number;
      y: number;
      viewport: ViewportSize;
    }
  | { type: 'RESIZE_WINDOW'; appId: AppId; bounds: WindowBounds }
  | { type: 'CLOSE_ALL' };

function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') {
    return { width: 1280, height: 800 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

function createInitialState(): WindowManagerState {
  const windows = {} as Record<AppId, WindowInstance>;

  for (const definition of APP_LIST) {
    windows[definition.id] = {
      appId: definition.id,
      title: definition.name,
      x: 120,
      y: 80,
      width: definition.defaultWidth,
      height: definition.defaultHeight,
      minWidth: definition.minWidth,
      minHeight: definition.minHeight,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: BASE_Z_INDEX,
    };
  }

  return {
    windows,
    nextZIndex: BASE_Z_INDEX + 1,
  };
}

function windowManagerReducer(
  state: WindowManagerState,
  action: WindowManagerAction
): WindowManagerState {
  switch (action.type) {
    case 'OPEN_APP': {
      const current = state.windows[action.appId];
      const nextZIndex = state.nextZIndex;

      if (current.isOpen) {
        return {
          ...state,
          nextZIndex: nextZIndex + 1,
          windows: {
            ...state.windows,
            [action.appId]: {
              ...current,
              isMinimized: false,
              zIndex: nextZIndex,
              payload: action.payload ?? current.payload,
            },
          },
        };
      }

      const openCount = Object.values(state.windows).filter(
        (windowItem) => windowItem.isOpen
      ).length;
      const initialBounds = computeInitialBounds(
        APP_REGISTRY[action.appId],
        openCount,
        action.viewport
      );

      return {
        ...state,
        nextZIndex: nextZIndex + 1,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...current,
            ...initialBounds,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            zIndex: nextZIndex,
            payload: action.payload,
          },
        },
      };
    }

    case 'CLOSE_APP': {
      const current = state.windows[action.appId];
      if (!current.isOpen) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...current,
            isOpen: false,
            isMinimized: false,
            isMaximized: false,
            payload: undefined,
          },
        },
      };
    }

    case 'FOCUS_APP': {
      const current = state.windows[action.appId];
      if (!current.isOpen) return state;

      return {
        ...state,
        nextZIndex: state.nextZIndex + 1,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...current,
            zIndex: state.nextZIndex,
          },
        },
      };
    }

    case 'MINIMIZE_APP': {
      const current = state.windows[action.appId];
      if (!current.isOpen || current.isMinimized) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...current,
            isMinimized: true,
          },
        },
      };
    }

    case 'RESTORE_AND_FOCUS': {
      const current = state.windows[action.appId];
      if (!current.isOpen) return state;

      return {
        ...state,
        nextZIndex: state.nextZIndex + 1,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...current,
            isMinimized: false,
            zIndex: state.nextZIndex,
          },
        },
      };
    }

    case 'TOGGLE_MAXIMIZE': {
      const current = state.windows[action.appId];
      if (!current.isOpen) return state;

      return {
        ...state,
        nextZIndex: state.nextZIndex + 1,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...current,
            isMaximized: !current.isMaximized,
            zIndex: state.nextZIndex,
          },
        },
      };
    }

    case 'MOVE_WINDOW': {
      const current = state.windows[action.appId];
      if (!current.isOpen) return state;

      const clamped = clampWindowPosition(
        action.x,
        action.y,
        current,
        action.viewport
      );

      return {
        ...state,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...current,
            x: clamped.x,
            y: clamped.y,
          },
        },
      };
    }

    case 'RESIZE_WINDOW': {
      const current = state.windows[action.appId];
      if (!current.isOpen) return state;

      return {
        ...state,
        windows: {
          ...state.windows,
          [action.appId]: {
            ...current,
            ...action.bounds,
          },
        },
      };
    }

    case 'CLOSE_ALL':
      return createInitialState();

    default:
      return state;
  }
}

interface WindowManagerContextValue {
  windows: Record<AppId, WindowInstance>;
  openWindows: WindowInstance[];
  focusedAppId: AppId | null;
  openApp: (appId: AppId, payload?: Record<string, unknown>) => void;
  closeApp: (appId: AppId) => void;
  focusApp: (appId: AppId) => void;
  minimizeApp: (appId: AppId) => void;
  restoreAndFocus: (appId: AppId) => void;
  toggleMaximizeApp: (appId: AppId) => void;
  moveWindow: (appId: AppId, x: number, y: number) => void;
  resizeWindow: (appId: AppId, bounds: WindowBounds) => void;
  closeAll: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
  null
);

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const [state, dispatch] = useReducer(
    windowManagerReducer,
    undefined,
    createInitialState
  );

  useEffect(() => {
    if (!isAdmin && state.windows.admin.isOpen) {
      dispatch({ type: 'CLOSE_APP', appId: 'admin' });
    }
  }, [isAdmin, state.windows.admin.isOpen]);

  const openApp = useCallback(
    (appId: AppId, payload?: Record<string, unknown>) => {
      if (APP_REGISTRY[appId].adminOnly && !isAdmin) {
        return;
      }
      dispatch({
        type: 'OPEN_APP',
        appId,
        viewport: getViewportSize(),
        payload,
      });
    },
    [isAdmin]
  );

  const closeApp = useCallback((appId: AppId) => {
    dispatch({ type: 'CLOSE_APP', appId });
  }, []);

  const focusApp = useCallback((appId: AppId) => {
    dispatch({ type: 'FOCUS_APP', appId });
  }, []);

  const minimizeApp = useCallback((appId: AppId) => {
    dispatch({ type: 'MINIMIZE_APP', appId });
  }, []);

  const restoreAndFocus = useCallback((appId: AppId) => {
    dispatch({ type: 'RESTORE_AND_FOCUS', appId });
  }, []);

  const toggleMaximizeApp = useCallback((appId: AppId) => {
    dispatch({ type: 'TOGGLE_MAXIMIZE', appId });
  }, []);

  const moveWindow = useCallback((appId: AppId, x: number, y: number) => {
    dispatch({
      type: 'MOVE_WINDOW',
      appId,
      x,
      y,
      viewport: getViewportSize(),
    });
  }, []);

  const resizeWindow = useCallback((appId: AppId, bounds: WindowBounds) => {
    dispatch({ type: 'RESIZE_WINDOW', appId, bounds });
  }, []);

  const closeAll = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL' });
  }, []);

  const openWindows = useMemo(
    () => Object.values(state.windows).filter((windowItem) => windowItem.isOpen),
    [state.windows]
  );

  const focusedAppId = useMemo<AppId | null>(() => {
    let topWindow: WindowInstance | null = null;
    for (const windowItem of openWindows) {
      if (windowItem.isMinimized) continue;
      if (!topWindow || windowItem.zIndex > topWindow.zIndex) {
        topWindow = windowItem;
      }
    }
    return topWindow ? topWindow.appId : null;
  }, [openWindows]);

  const value = useMemo<WindowManagerContextValue>(
    () => ({
      windows: state.windows,
      openWindows,
      focusedAppId,
      openApp,
      closeApp,
      focusApp,
      minimizeApp,
      restoreAndFocus,
      toggleMaximizeApp,
      moveWindow,
      resizeWindow,
      closeAll,
    }),
    [
      state.windows,
      openWindows,
      focusedAppId,
      openApp,
      closeApp,
      focusApp,
      minimizeApp,
      restoreAndFocus,
      toggleMaximizeApp,
      moveWindow,
      resizeWindow,
      closeAll,
    ]
  );

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
}

export function useWindowManager(): WindowManagerContextValue {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error(
      'useWindowManager must be used within a WindowManagerProvider'
    );
  }
  return context;
}
