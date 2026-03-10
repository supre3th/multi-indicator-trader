/**
 * Simple debug logger for development
 */
export const debug = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', new Date().toISOString(), ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', new Date().toISOString(), ...args);
  },
};
