// Simple logger utility for consistent logging across the application

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;

    if (data) {
      return `${baseMessage} ${JSON.stringify(data, null, 2)}`;
    }

    return baseMessage;
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage('INFO', message, data));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;

    console.error(this.formatMessage('ERROR', message, errorData));
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  success(message: string, data?: any) {
    console.log(this.formatMessage('SUCCESS', message, data));
  }
}

// Export convenience function for creating loggers
export const createLogger = (context: string) => new Logger(context);
