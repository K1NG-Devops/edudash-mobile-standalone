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
       
      console.debug(...format('debug', namespace, message, ...args));
    }
  },
  info: (message?: unknown, ...args: unknown[]) => {
    if (isDebugEnabled(namespace)) {
       
      console.info(...format('info', namespace, message, ...args));
    }
  },
  log: (message?: unknown, ...args: unknown[]) => {
    if (isDebugEnabled(namespace)) {
       
      console.log(...format('info', namespace, message, ...args));
    }
  },
  warn: (message?: unknown, ...args: unknown[]) => {
    if (isDebugEnabled(namespace)) {
       
      console.warn(...format('warn', namespace, message, ...args));
    }
  },
  error: (message?: unknown, ...args: unknown[]) => {
    // Errors always log
     
    console.error(...format('error', namespace, message, ...args));
  },
});

export const logger = createLogger();

