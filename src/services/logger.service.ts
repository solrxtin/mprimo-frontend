import winston, { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

export class LoggerService {
  private logger: winston.Logger;
  private static instance: LoggerService;

  private constructor() {
    const logDir = 'logs';
    const { combine, timestamp, printf, colorize } = format;

    // Custom log format
    const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
      let msg = `${timestamp} [${level}] : ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }
      return msg;
    });

    // Transport for daily rotate file
    const fileRotateTransport = new DailyRotateFile({
      filename: path.join(logDir, '%DATE%-app.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
      zippedArchive: true,
    });

    // Transport for error logs
    const errorRotateTransport = new DailyRotateFile({
      filename: path.join(logDir, '%DATE%-error.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      maxSize: '20m',
      zippedArchive: true,
      level: 'error',
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
      transports: [
        // Console transport
        new winston.transports.Console({
          format: combine(
            colorize(),
            logFormat
          )
        }),
        fileRotateTransport,
        errorRotateTransport
      ]
    });
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  info(message: string, meta: object = {}) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error | unknown, meta: object = {}) {
    if (error instanceof Error) {
      this.logger.error(message, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        ...meta
      });
    } else {
      this.logger.error(message, { error, ...meta });
    }
  }

  warn(message: string, meta: object = {}) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta: object = {}) {
    this.logger.debug(message, meta);
  }

  // HTTP request logging
  httpRequest(req: any, res: any, responseTime: number) {
    const meta = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    };

    this.info(`HTTP ${req.method} ${req.url}`, meta);
  }
}
