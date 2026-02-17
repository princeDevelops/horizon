import winston from 'winston';
import path from 'node:path';
import util from 'node:util';

const timestampFormat = 'YYYY-MM-DD HH:mm:ss';
const colorizer = winston.format.colorize();

const loggerFileName = path.basename(__filename).replace(/\\/g, '/');

const extractCaller = (stack?: string): string | undefined => {
  if (!stack) {
    return undefined;
  }

  const lines = stack.split('\n').slice(1);

  for (const line of lines) {
    if (line.includes('node:internal') || line.includes('node_modules')) {
      continue;
    }
    if (line.includes(loggerFileName)) {
      continue;
    }

    const withFunction = line.match(/\((.+):(\d+):(\d+)\)/);
    const withoutFunction = line.match(/at (.+):(\d+):(\d+)/);
    const match = withFunction || withoutFunction;

    if (match) {
      const fullPath = match[1].replace(/\\/g, '/');
      const file = path.basename(fullPath);
      const lineNo = match[2];
      return `${file}:${lineNo}`;
    }
  }

  return undefined;
};

const addCallerFormat = winston.format((info) => {
  if (!info.caller) {
    const traceHolder: { stack?: string } = {};
    Error.captureStackTrace(traceHolder);
    info.caller = extractCaller(traceHolder.stack);
  }
  return info;
});

const consoleFormat = winston.format.printf(
  ({ timestamp, level, message, stack, caller, ...meta }) => {
    const ts = timestamp ? `[${timestamp}]` : '';
    const rawLevel = String(level).toLowerCase();
    const lvl = String(level).toUpperCase();
    const baseMessage = String(stack || message);
    const coloredLevel = colorizer.colorize(rawLevel, lvl);
    const coloredMessage = colorizer.colorize(rawLevel, baseMessage);
    const callerText = caller ? ` [${String(caller)}]` : '';
    const plainMeta = Object.keys(meta).reduce<Record<string, unknown>>(
      (acc, key) => {
        acc[key] = (meta as Record<string, unknown>)[key];
        return acc;
      },
      {}
    );
    const hasMeta = Object.keys(plainMeta).length > 0;
    const metaString = hasMeta
      ? `\n${util.inspect(plainMeta, {
          depth: null,
          colors: false,
          compact: false,
          breakLength: 100,
        })}`
      : '';

    return `${ts} ${coloredLevel}${callerText}: ${coloredMessage}${metaString}`.trim();
  }
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: timestampFormat }),
    winston.format.errors({ stack: true }),
    addCallerFormat()
  ),
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});
