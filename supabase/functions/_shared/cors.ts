// Shared CORS utilities for Supabase Edge Functions
// Use an allowlist configured via ALLOWED_ORIGINS secret (comma-separated)

function isOriginAllowed(origin: string, allowedList: string[]): boolean {
  // Exact match
  if (allowedList.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const host = url.host; // e.g., foo.vercel.app
    const protocol = url.protocol; // e.g., https:

    for (const entry of allowedList) {
      // Support entries like https://*.vercel.app or http://localhost:8081
      if (entry.includes('*')) {
        // Split into protocol and host pattern
        const [entryProtocol, entryHost] = entry.split('://');
        if (entryProtocol && entryHost) {
          if (entryProtocol + ':' !== protocol) continue;
          // Only support prefix wildcard: *.domain.tld
          if (entryHost.startsWith('*.')) {
            const suffix = entryHost.slice(2); // remove *.
            if (host === suffix || host.endsWith('.' + suffix)) {
              return true;
            }
          }
        }
      }
    }
  } catch {
    // If origin is not a valid URL, fall back to exact comparison only
  }
  return false;
}

export function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin = origin && isOriginAllowed(origin, allowed)
    ? origin
    : (allowed.length === 0 ? '*' : '');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }

  return headers;
}
