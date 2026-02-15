import 'dotenv/config';
import winston from 'winston';

const timestampFormat = 'YYYY-MM-DD HH:mm:ss';
const colorizer = winston.format.colorize();

const consoleFormat = winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
  const ts = timestamp ? `[${timestamp}]` : '';
  const rawLevel = String(level).toLowerCase();
  const lvl = String(level).toUpperCase();
  const baseMessage = String(stack || message);
  const coloredLevel = colorizer.colorize(rawLevel, lvl);
  const coloredMessage = colorizer.colorize(rawLevel, baseMessage);
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';

  return `${ts} ${coloredLevel}: ${coloredMessage}${metaString}`.trim();
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: timestampFormat }),
    winston.format.errors({ stack: true })
  ),
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});
