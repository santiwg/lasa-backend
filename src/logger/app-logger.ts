import * as fs from 'node:fs';
import * as path from 'node:path';

import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
// winston-daily-rotate-file is published as CommonJS. In a CommonJS Nest setup,
// using a default import may produce { default: ... } and break `new ...()`.
import DailyRotateFile = require('winston-daily-rotate-file');

function ensureLogsDir(): string {
  // We write logs to <projectRoot>/logs by default.
  // Note: if you run inside Docker, mount this folder as a volume if you want persistence.
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

export function createAppLogger() {
  const logsDir = ensureLogsDir();

  return WinstonModule.createLogger({
    // JSON logs with timestamps; include stack traces when logging errors.
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    transports: [
      // Console transport: keeps logs visible in the terminal (stdout/stderr).
      new winston.transports.Console({ level: 'debug' }),

      // Daily-rotated file transport: writes ONLY error logs to one file per day.
      new DailyRotateFile({
        level: 'error',
        dirname: logsDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
      }),
    ],
  });
}
