import { describe, expect, it } from 'vitest';
import { APP_REGISTRY } from '../adwaita';
import {
  CASCADE_STEP,
  clampWindowPosition,
  computeInitialBounds,
  computeResizedBounds,
  MIN_VISIBLE_EDGE,
  TOP_BAR_HEIGHT,
  type ResizeDirection,
} from '../windowLayout';

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

describe('computeInitialBounds', () => {
  it('centers the first window and cascades subsequent windows', () => {
    const first = computeInitialBounds(APP_REGISTRY.about, 0, DESKTOP_VIEWPORT);
    const second = computeInitialBounds(APP_REGISTRY.about, 1, DESKTOP_VIEWPORT);

    expect(first.width).toBe(APP_REGISTRY.about.defaultWidth);
    expect(first.height).toBe(APP_REGISTRY.about.defaultHeight);
    expect(first.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);

    expect(second.x).toBe(first.x + CASCADE_STEP);
    expect(second.y).toBe(first.y + CASCADE_STEP);
  });

  it('shrinks window dimensions to fit smaller viewports', () => {
    const compactViewport = { width: 800, height: 600 };
    const bounds = computeInitialBounds(APP_REGISTRY.projects, 0, compactViewport);

    expect(bounds.width).toBeLessThanOrEqual(compactViewport.width);
    expect(bounds.height).toBeLessThanOrEqual(compactViewport.height - TOP_BAR_HEIGHT);
    expect(bounds.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
  });
});

describe('clampWindowPosition', () => {
  it('prevents dragging above the GNOME top bar', () => {
    const clamped = clampWindowPosition(
      200,
      -50,
      { width: 600, height: 400 },
      DESKTOP_VIEWPORT
    );
    expect(clamped.y).toBe(TOP_BAR_HEIGHT);
    expect(clamped.x).toBe(200);
  });

  it('keeps at least MIN_VISIBLE_EDGE pixels inside viewport horizontally and vertically', () => {
    const farLeft = clampWindowPosition(
      -900,
      200,
      { width: 600, height: 400 },
      DESKTOP_VIEWPORT
    );
    expect(farLeft.x).toBe(-600 + MIN_VISIBLE_EDGE);

    const farRight = clampWindowPosition(
      2000,
      1200,
      { width: 600, height: 400 },
      DESKTOP_VIEWPORT
    );
    expect(farRight.x).toBe(DESKTOP_VIEWPORT.width - MIN_VISIBLE_EDGE);
    expect(farRight.y).toBe(DESKTOP_VIEWPORT.height - MIN_VISIBLE_EDGE);
  });
});

describe('computeResizedBounds', () => {
  const startBounds = { x: 300, y: 150, width: 600, height: 400 };
  const minWidth = 400;
  const minHeight = 300;

  it('expands and shrinks east and south edges within limits', () => {
    const expanded = computeResizedBounds(
      startBounds,
      'south-east',
      120,
      80,
      minWidth,
      minHeight,
      DESKTOP_VIEWPORT
    );
    expect(expanded).toEqual({ x: 300, y: 150, width: 720, height: 480 });

    const shrunk = computeResizedBounds(
      startBounds,
      'south-east',
      -500,
      -500,
      minWidth,
      minHeight,
      DESKTOP_VIEWPORT
    );
    expect(shrunk).toEqual({ x: 300, y: 150, width: minWidth, height: minHeight });
  });

  it('anchors right and bottom edges when resizing west and north', () => {
    const resized = computeResizedBounds(
      startBounds,
      'north-west',
      -50,
      -40,
      minWidth,
      minHeight,
      DESKTOP_VIEWPORT
    );
    expect(resized).toEqual({ x: 250, y: 110, width: 650, height: 440 });
    expect(resized.x + resized.width).toBe(startBounds.x + startBounds.width);
    expect(resized.y + resized.height).toBe(startBounds.y + startBounds.height);
  });

  it('does not allow resizing north past TOP_BAR_HEIGHT', () => {
    const resized = computeResizedBounds(
      startBounds,
      'north',
      0,
      -400,
      minWidth,
      minHeight,
      DESKTOP_VIEWPORT
    );
    expect(resized.y).toBe(TOP_BAR_HEIGHT);
    expect(resized.y + resized.height).toBe(startBounds.y + startBounds.height);
  });

  it('handles all 8 unabbreviated ResizeDirection values without NaN', () => {
    const directions: ResizeDirection[] = [
      'north',
      'south',
      'east',
      'west',
      'north-east',
      'north-west',
      'south-east',
      'south-west',
    ];

    for (const direction of directions) {
      const result = computeResizedBounds(
        startBounds,
        direction,
        25,
        -25,
        minWidth,
        minHeight,
        DESKTOP_VIEWPORT
      );
      expect(result.width).toBeGreaterThanOrEqual(minWidth);
      expect(result.height).toBeGreaterThanOrEqual(minHeight);
      expect(result.y).toBeGreaterThanOrEqual(TOP_BAR_HEIGHT);
    }
  });
});
