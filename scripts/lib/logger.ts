/**
 * Minimal level-aware logger for the data pipeline.
 *
 * Honours LOG_LEVEL env var (`debug` | `info` | `warn` | `error`).
 * Defaults to `info`. Output goes to stderr so it does not pollute stdout
 * pipelines.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): number {
  const raw = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as Level;
  return ORDER[raw] ?? ORDER.info;
}

function shouldLog(level: Level): boolean {
  return ORDER[level] >= currentLevel();
}

function format(scope: string, level: Level, msg: string): string {
  const ts = new Date().toISOString();
  return `[${ts}] [${level.toUpperCase()}] [${scope}] ${msg}`;
}

export interface Logger {
  debug(msg: string): void;
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  child(subscope: string): Logger;
}

export function createLogger(scope: string): Logger {
  const log = (level: Level, msg: string): void => {
    if (!shouldLog(level)) return;
    const line = format(scope, level, msg);
    if (level === 'error' || level === 'warn') {
      console.error(line);
    } else {
      console.warn(line);
    }
  };
  return {
    debug: (msg) => log('debug', msg),
    info: (msg) => log('info', msg),
    warn: (msg) => log('warn', msg),
    error: (msg) => log('error', msg),
    child: (subscope) => createLogger(`${scope}:${subscope}`),
  };
}

export const rootLogger = createLogger('pipeline');
