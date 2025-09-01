export type AppErrorType =
  | 'auth'
  | 'rate_limit'
  | 'quota'
  | 'network'
  | 'ai_config'
  | 'validation'
  | 'unknown';

export interface AppErrorInfo {
  type: AppErrorType;
  code?: string | number;
  userMessage: string;
  chargeProtected?: boolean;
}

function toLower(s: unknown): string {
  return typeof s === 'string' ? s.toLowerCase() : '';
}

export function classifyError(error: unknown): AppErrorInfo {
  try {
    const err = error as any;
    const code = err?.code ?? err?.status ?? err?.statusCode;
    const msg = toLower(err?.message) || toLower(String(err));

    // Explicit auth status codes
    if (code === 401 || code === '401' || msg.includes('unauthorized') || msg.includes('not authenticated')) {
      return {
        type: 'auth',
        code,
        userMessage: 'You are not authenticated or your session has expired. Please sign in and try again.',
      };
    }

    // Auth keywords
    if (
      msg.includes('auth') ||
      msg.includes('authentication') ||
      msg.includes('invalid token') ||
      msg.includes('session') ||
      msg.includes('supabase')
    ) {
      return {
        type: 'auth',
        code,
        userMessage: 'An authentication issue occurred. Please sign in again or refresh your session.',
      };
    }

    // AI config / API key issues
    if (
      msg.includes('anthropic') ||
      msg.includes('api key') ||
      msg.includes('missing api key') ||
      msg.includes('provider') && msg.includes('configuration') ||
      msg.includes('model') && msg.includes('not set')
    ) {
      return {
        type: 'ai_config',
        code,
        userMessage: 'AI configuration appears to be missing or invalid (e.g., API key or model). Please check your environment settings.',
      };
    }

    // Rate limit
    if (code === 429 || code === '429' || msg.includes('rate limit') || msg.includes('too many requests')) {
      return {
        type: 'rate_limit',
        code,
        userMessage: 'You’re sending requests too quickly. Please wait a moment and try again.',
      };
    }

    // Quota / credit limit
    if (
      msg.includes('quota') ||
      msg.includes('credit') ||
      msg.includes('usage limit') ||
      msg.includes('not counted against your quota') ||
      msg.includes('not count towards your quota')
    ) {
      return {
        type: 'quota',
        code,
        userMessage: 'You’ve reached your AI usage limit. You can try again later or consider upgrading your plan.',
        chargeProtected: msg.includes('not counted against your quota') || msg.includes('not count towards your quota'),
      };
    }

    // Network
    if (
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('timeout') ||
      msg.includes('econn') ||
      msg.includes('enotfound') ||
      msg.includes('eai_again')
    ) {
      return {
        type: 'network',
        code,
        userMessage: 'A network error occurred. Please check your connection and try again.',
      };
    }

    // Validation-style issues (safe default)
    if (msg.includes('invalid') || msg.includes('missing') || msg.includes('required')) {
      return {
        type: 'validation',
        code,
        userMessage: 'Some inputs look invalid or incomplete. Please review and try again.',
      };
    }

    return {
      type: 'unknown',
      code,
      userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    };
  } catch {
    return {
      type: 'unknown',
      userMessage: 'An unexpected error occurred. Please try again.',
    };
  }
}

