/**
 * Centralized logging utility
 * In development: logs to console
 * In production: prepares for monitoring service integration (Sentry, LogRocket, etc.)
 */

const isDev = import.meta.env.DEV;

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (isDev) {
      console.error(`[ERROR] ${message}`, error, context);
    } else {
      // In production, send to monitoring service
      // Example: Sentry.captureException(error, { extra: { message, ...context } });
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (isDev) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      // In production, send to monitoring service
      // Example: Sentry.captureMessage(message, { level: 'warning', extra: context });
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (isDev) {
      // eslint-disable-next-line no-console -- logger outputs to console in dev
      console.info(`[INFO] ${message}`, context);
    }
    // Info logs are typically not sent to monitoring in production
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (isDev) {
      // eslint-disable-next-line no-console -- logger outputs to console in dev
      console.debug(`[DEBUG] ${message}`, context);
    }
  }
}

export const logger = new Logger();
