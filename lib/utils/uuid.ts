// UUID utility helpers for EduDash Pro
// Provides runtime-safe validation and normalization across platforms

export function validateUUID(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;

  // Hyphenated UUID v1-v5 with correct variant bits
  const hyphenated = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  // 32 hex characters (no hyphens)
  const compact = /^[0-9a-fA-F]{32}$/;

  if (hyphenated.test(value)) {
    return value.toLowerCase();
  }

  if (compact.test(value)) {
    const s = value.toLowerCase();
    // Insert hyphens to normalize to 8-4-4-4-12
    return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
  }

  return null;
}

export function isUUID(input: unknown): input is string {
  return validateUUID(input) !== null;
}

