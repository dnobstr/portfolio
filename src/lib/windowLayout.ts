import type { AppDefinition, WindowBounds } from '../types/window';

export const TOP_BAR_HEIGHT = 32;
export const DOCK_CLEARANCE = 76;
export const CASCADE_STEP = 28;
export const MIN_VISIBLE_EDGE = 80;

export type ResizeDirection =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west';

export interface ViewportSize {
  width: number;
  height: number;
}

export function computeInitialBounds(
  app: AppDefinition,
  openCount: number,
  viewport: ViewportSize
): WindowBounds {
  const horizontalMargin = 24;
  const verticalMargin = 16;
  const usableWidth = Math.max(320, viewport.width - horizontalMargin * 2);
  const usableHeight = Math.max(
    240,
    viewport.height - TOP_BAR_HEIGHT - DOCK_CLEARANCE - verticalMargin * 2
  );

  const width = Math.min(app.defaultWidth, usableWidth);
  const height = Math.min(app.defaultHeight, usableHeight);

  const cascadeIndex = openCount % 6;
  const cascadeOffset = cascadeIndex * CASCADE_STEP;

  const centeredX = Math.round((viewport.width - width) / 2) + cascadeOffset;
  const centeredY =
    Math.round(TOP_BAR_HEIGHT + (usableHeight - height) / 2 + verticalMargin) +
    cascadeOffset;

  const clamped = clampWindowPosition(
    centeredX,
    centeredY,
    { width, height },
    viewport
  );

  return {
    x: clamped.x,
    y: clamped.y,
    width,
    height,
  };
}

export function clampWindowPosition(
  x: number,
  y: number,
  bounds: Pick<WindowBounds, 'width' | 'height'>,
  viewport: ViewportSize
): { x: number; y: number } {
  const minX = -bounds.width + MIN_VISIBLE_EDGE;
  const maxX = Math.max(minX, viewport.width - MIN_VISIBLE_EDGE);

  const minY = TOP_BAR_HEIGHT;
  const maxY = Math.max(minY, viewport.height - MIN_VISIBLE_EDGE);

  return {
    x: Math.round(Math.min(Math.max(x, minX), maxX)),
    y: Math.round(Math.min(Math.max(y, minY), maxY)),
  };
}

export function computeResizedBounds(
  start: WindowBounds,
  direction: ResizeDirection,
  deltaX: number,
  deltaY: number,
  minWidth: number,
  minHeight: number,
  viewport: ViewportSize
): WindowBounds {
  let { x, y, width, height } = start;

  const resizeEast =
    direction === 'east' ||
    direction === 'north-east' ||
    direction === 'south-east';
  const resizeWest =
    direction === 'west' ||
    direction === 'north-west' ||
    direction === 'south-west';
  const resizeSouth =
    direction === 'south' ||
    direction === 'south-east' ||
    direction === 'south-west';
  const resizeNorth =
    direction === 'north' ||
    direction === 'north-east' ||
    direction === 'north-west';

  if (resizeEast) {
    const maxWidth = Math.max(minWidth, viewport.width - start.x);
    width = Math.min(Math.max(start.width + deltaX, minWidth), maxWidth);
  }

  if (resizeWest) {
    const rightEdge = start.x + start.width;
    const proposedWidth = Math.max(start.width - deltaX, minWidth);
    const maxWidth = Math.max(minWidth, rightEdge);
    width = Math.min(proposedWidth, maxWidth);
    x = rightEdge - width;
  }

  if (resizeSouth) {
    const maxHeight = Math.max(minHeight, viewport.height - start.y);
    height = Math.min(Math.max(start.height + deltaY, minHeight), maxHeight);
  }

  if (resizeNorth) {
    const bottomEdge = start.y + start.height;
    const proposedHeight = Math.max(start.height - deltaY, minHeight);
    const maxHeight = Math.max(minHeight, bottomEdge - TOP_BAR_HEIGHT);
    height = Math.min(proposedHeight, maxHeight);
    y = bottomEdge - height;
  }

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  };
}
