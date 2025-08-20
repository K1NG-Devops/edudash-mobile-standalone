/*
 Minimal logger gated by environment flags. Use this to avoid stray console logs in production.
*/

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDebugEnabled = (namespace?: string): boolean => {
  const globalFlag = process.env.EXPO_PUBLIC_DEBUG === 'true';
  const nsFlag = namespace ? process.env[`EXPO_PUBLIC_DEBUG_${namespace.toUpperCase()}`] === 'true' : false;
  return Boolean(globalFlag || nsFlag);
};

const format = (level: LogLevel, namespace: string | undefined, message: unknown, ...args: unknown[]) => {
  const prefix = namespace ? `[${namespace}]` : '';
  return [`${prefix}`, message, ...args];
};

export const createLogger = (namespace?: string) => ({
  debug: (message?: unknown, ...args: unknown[]) => {
    if (isDebugEnabled(namespace)) {
      // eslint-disable-next-line no-console

    }
  },
  info: (message?: unknown, ...args: unknown[]) => {
    if (isDebugEnabled(namespace)) {
      // eslint-disable-next-line no-console

    }
  },
  warn: (message?: unknown, ...args: unknown[]) => {
    if (isDebugEnabled(namespace)) {
      // eslint-disable-next-line no-console
      log.warn(...format('warn', namespace, message, ...args));
    }
  },
  error: (message?: unknown, ...args: unknown[]) => {
    // Errors always log
    // eslint-disable-next-line no-console
    log.error(...format('error', namespace, message, ...args));
  },
});

export const logger = createLogger();

