export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

const clientLevel =
  (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel | undefined) ?? 'info';
const serverLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';

const activeLevel: LogLevel =
  typeof window === 'undefined' ? serverLevel : clientLevel;

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] <= LEVELS[activeLevel];
}

function fmt(tag: string, msg: string) {
  return `[${tag}] ${msg}`;
}

export const logger = {
  debug(msg: string) {
    if (shouldLog('debug')) console.debug(fmt('debug', msg));
  },
  info(msg: string) {
    if (shouldLog('info')) console.info(fmt('info', msg));
  },
  warn(msg: string) {
    if (shouldLog('warn')) console.warn(fmt('warn', msg));
  },
  error(msg: string) {
    if (shouldLog('error')) console.error(fmt('error', msg));
  },
};