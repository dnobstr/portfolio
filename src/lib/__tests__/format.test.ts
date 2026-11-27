import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  formatLockClock,
  formatTopBarDate,
  inferScreensaverType,
  MAX_UPLOAD_BYTES,
  sanitizeExternalUrl,
  validateUploadFile,
} from '../format';

describe('sanitizeExternalUrl', () => {
  it('allows https, http, mailto, and relative root paths', () => {
    expect(sanitizeExternalUrl('https://github.com/dnobstr')).toBe(
      'https://github.com/dnobstr'
    );
    expect(sanitizeExternalUrl('http://example.com')).toBe('http://example.com/');
    expect(sanitizeExternalUrl('mailto:hello@example.com')).toBe(
      'mailto:hello@example.com'
    );
    expect(sanitizeExternalUrl('/portfolio/defaults/default-wallpaper.svg')).toBe(
      '/portfolio/defaults/default-wallpaper.svg'
    );
  });

  it('rejects unsafe javascript/data schemes and invalid URLs', () => {
    expect(sanitizeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeExternalUrl('not a valid url')).toBeNull();
    expect(sanitizeExternalUrl('')).toBeNull();
    expect(sanitizeExternalUrl(null)).toBeNull();
  });
});

describe('validateUploadFile', () => {
  it('accepts valid image, screensaver video, document, and markdown files', () => {
    expect(
      validateUploadFile({ name: 'thumb.webp', size: 1024, type: 'image/webp' }, 'image')
    ).toEqual({ ok: true });

    expect(
      validateUploadFile({ name: 'loop.mp4', size: 5_000_000, type: 'video/mp4' }, 'screensaver')
    ).toEqual({ ok: true });

    expect(
      validateUploadFile({ name: 'cv.pdf', size: 500_000, type: 'application/pdf' }, 'document')
    ).toEqual({ ok: true });

    expect(
      validateUploadFile({ name: 'case-study.md', size: 2048, type: '' }, 'markdown')
    ).toEqual({ ok: true });
  });

  it('rejects oversized, empty, or wrong MIME files', () => {
    expect(
      validateUploadFile({ name: 'empty.png', size: 0, type: 'image/png' }, 'image').ok
    ).toBe(false);

    expect(
      validateUploadFile(
        { name: 'huge.mp4', size: MAX_UPLOAD_BYTES + 1, type: 'video/mp4' },
        'screensaver'
      ).ok
    ).toBe(false);

    expect(
      validateUploadFile({ name: 'script.js', size: 512, type: 'text/javascript' }, 'image').ok
    ).toBe(false);
  });
});

describe('inferScreensaverType', () => {
  it('detects video, gif, and static images accurately', () => {
    expect(inferScreensaverType('video/mp4')).toBe('video');
    expect(inferScreensaverType('https://cdn.example.com/loop.webm')).toBe('video');
    expect(inferScreensaverType('image/gif')).toBe('gif');
    expect(inferScreensaverType('https://cdn.example.com/anim.GIF')).toBe('gif');
    expect(inferScreensaverType('image/png')).toBe('image');
  });
});

describe('formatting helpers', () => {
  it('formats file sizes cleanly', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('formats GNOME clock and top bar date strings', () => {
    const sample = new Date('2026-11-26T09:05:00');
    expect(formatLockClock(sample)).toBe('09:05');
    expect(formatTopBarDate(sample)).toMatch(/Nov\s+26\s+09:05/);
  });
});
