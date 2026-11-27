import type { ScreensaverType } from '../types/database';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export type UploadCategory = 'image' | 'screensaver' | 'document' | 'markdown';

const ALLOWED_MIMES: Record<UploadCategory, readonly string[]> = {
  image: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
  ],
  screensaver: [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
    'video/mp4',
    'video/webm',
  ],
  document: ['application/pdf'],
  markdown: ['text/markdown', 'text/plain', ''],
};

export function sanitizeExternalUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'mailto:'
    ) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function validateUploadFile(
  file: Pick<File, 'name' | 'size' | 'type'>,
  category: UploadCategory
): { ok: true } | { ok: false; error: string } {
  if (file.size <= 0) {
    return { ok: false, error: 'Selected file is empty.' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File exceeds the 25 MB upload limit (${formatFileSize(file.size)}).`,
    };
  }

  const allowed = ALLOWED_MIMES[category];
  if (category === 'markdown') {
    const lowerName = file.name.toLowerCase();
    const isMdExt = lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || lowerName.endsWith('.txt');
    if (!isMdExt && !allowed.includes(file.type)) {
      return { ok: false, error: 'Please select a .md or .txt file.' };
    }
    return { ok: true };
  }

  if (!allowed.includes(file.type)) {
    return {
      ok: false,
      error: `Unsupported file type "${file.type || 'unknown'}" for ${category}.`,
    };
  }

  return { ok: true };
}

export function inferScreensaverType(mimeOrUrl: string): ScreensaverType {
  const lower = mimeOrUrl.toLowerCase();
  if (
    lower.startsWith('video/') ||
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm')
  ) {
    return 'video';
  }
  if (lower === 'image/gif' || lower.endsWith('.gif')) {
    return 'gif';
  }
  return 'image';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatTopBarDate(date: Date): string {
  const monthDay = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);

  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return `${monthDay}  ${time}`;
}

export function formatLockClock(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatLockDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
