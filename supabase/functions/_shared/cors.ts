// Shared CORS utilities for Supabase Edge Functions
// Use an allowlist configured via ALLOWED_ORIGINS secret (comma-separated)

function isOriginAllowed(origin: string, allowedList: string[]): boolean {
  // Exact match
  if (allowedList.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const host = url.host; // e.g., localhost:19006, foo.vercel.app
    const hostname = url.hostname; // without port
    const protocol = url.protocol; // e.g., https:
    const port = url.port; // may be empty

    for (const entry of allowedList) {
      // Support entries like https://*.vercel.app
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
      } else {
        // Support localhost/127.0.0.1 with any port via :* suffix, or match ignoring port if entry omits a port
        try {
          // Special port-wildcard pattern (e.g., http://localhost:*)
          if (entry.endsWith(':*')) {
            const base = entry.slice(0, -2); // remove :*
            const baseUrl = new URL(base);
            if (baseUrl.protocol === protocol && baseUrl.hostname === hostname) {
              return true;
            }
          } else {
            const e = new URL(entry);
            const sameHostIgnoringPort = e.protocol === protocol && e.hostname === hostname;
            const exactHostPort = e.protocol === protocol && e.host === host; // includes port comparison if present
            if (exactHostPort || (sameHostIgnoringPort && e.port === '')) {
              return true;
            }
          }
        } catch {
          // ignore malformed entries
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
