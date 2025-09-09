import type { LogLevel, LoggerOptions, LoggerService } from "../types.ts";

type ErrorLike = Error | string | undefined;

const DEFAULT_LEVELS: ReadonlyArray<LogLevel> = ["log", "error", "warn"];
const DEBUG_LEVELS: ReadonlyArray<LogLevel> = [
  "log",
  "error",
  "warn",
  "debug",
  "verbose",
];

class ConsoleLogger implements LoggerService {
  private levels = new Set<LogLevel>(DEFAULT_LEVELS as LogLevel[]);
  private options: LoggerOptions = {
    timestamp: "iso",
    colors: true,
    json: false,
    symbols: false,
    prettyObjects: true,
    contextStyle: "brackets",
  };

  constructor(levels?: LogLevel[], options?: LoggerOptions) {
    if (levels && levels.length > 0) this.levels = new Set(levels);
    if (options) this.options = { ...this.options, ...options };
  }

  setLogLevels(levels: LogLevel[]): void {
    this.levels = new Set(levels);
  }

  configure(options?: LoggerOptions): void {
    if (options) this.options = { ...this.options, ...options };
  }

  log(message: any, context?: string): void {
    if (!this.levels.has("log")) return;
    this.write("log", message, context);
  }

  error(message: any, trace?: ErrorLike, context?: string): void {
    if (!this.levels.has("error")) return;
    const payload = this.formatPayload("error", message, context, trace);
    if (this.options.json) {
      console.error(JSON.stringify(payload));
      return;
    }
    const { color, badge } = this.getLevelStyle("error");
    const line = this.formatLine(payload, color, badge);
    console.error(line);
  }

  warn(message: any, context?: string): void {
    if (!this.levels.has("warn")) return;
    this.write("warn", message, context);
  }

  debug(message: any, context?: string): void {
    if (!this.levels.has("debug")) return;
    this.write("debug", message, context);
  }

  verbose(message: any, context?: string): void {
    if (!this.levels.has("verbose")) return;
    this.write("verbose", message, context);
  }

  private write(level: LogLevel, message: any, context?: string): void {
    const payload = this.formatPayload(level, message, context);
    if (this.options.json) {
      console.log(JSON.stringify(payload));
      return;
    }
    const levelMeta = this.getLevelStyle(level);
    const line = this.formatLine(payload, levelMeta.color, levelMeta.badge);
    if (level === "warn") console.warn(line);
    else console.log(line);
  }

  private formatPayload(
    level: LogLevel,
    message: any,
    context?: string,
    trace?: ErrorLike
  ): Record<string, any> {
    const ts = this.buildTimestamp();
    const payload: Record<string, any> = {
      level,
      message,
      context,
      timestamp: ts,
    };
    if (trace) {
      payload.trace =
        typeof trace === "string" ? trace : trace?.stack || trace?.message;
    }
    return payload;
  }

  private buildTimestamp(): string | undefined {
    if (!this.options.timestamp) return undefined;
    if (this.options.timestamp === true || this.options.timestamp === "iso")
      return new Date().toISOString();
    if (this.options.timestamp === "local") return new Date().toLocaleString();
    return undefined;
  }

  private formatLine(
    payload: Record<string, any>,
    color: string,
    badge: string
  ): string {
    const parts: string[] = [];
    if (payload.timestamp)
      parts.push(this.decorate(`[${payload.timestamp}]`, "\x1b[90m"));
    const lvl = (payload.level as string).toUpperCase().padEnd(7, " ");
    const levelStr = this.options.colors ? `${color}${lvl}\x1b[0m` : lvl;
    const badgeStr = this.options.symbols && badge ? `${badge} ` : "";
    parts.push(`${badgeStr}${levelStr}`);

    if (payload.context) {
      const ctx = String(payload.context);
      const ctxStr =
        this.options.contextStyle === "at"
          ? `@${ctx}`
          : this.options.contextStyle === "none"
          ? ctx
          : `[${ctx}]`;
      parts.push(this.decorate(ctxStr, "\x1b[35m"));
    }

    const msg =
      typeof payload.message === "string"
        ? payload.message
        : this.options.prettyObjects
        ? JSON.stringify(payload.message, null, 2)
        : JSON.stringify(payload.message);
    parts.push(msg);

    if (payload.trace)
      parts.push(`\n${this.decorate(String(payload.trace), "\x1b[90m")}`);
    return parts.join(" ");
  }

  private getLevelStyle(level: LogLevel): { color: string; badge: string } {
    switch (level) {
      case "error":
        return { color: "\x1b[31m", badge: "ERR" };
      case "warn":
        return { color: "\x1b[33m", badge: "WRN" };
      case "debug":
        return { color: "\x1b[36m", badge: "DBG" };
      case "verbose":
        return { color: "\x1b[90m", badge: "VRB" };
      case "log":
      default:
        return { color: "\x1b[32m", badge: "LOG" };
    }
  }

  private decorate(text: string, color: string): string {
    return this.options.colors ? `${color}${text}\x1b[0m` : text;
  }
}

export class Logger implements LoggerService {
  private static logger: LoggerService = new ConsoleLogger();
  private static levels: LogLevel[] = [...DEFAULT_LEVELS];

  constructor(private readonly context?: string) {}

  static configure(input?: {
    levels?: LogLevel[];
    logger?: LoggerService;
    options?: LoggerOptions;
    debug?: boolean;
  }): void {
    const levels =
      input?.levels ?? (input?.debug ? [...DEBUG_LEVELS] : [...DEFAULT_LEVELS]);
    Logger.levels = levels;
    if (input?.logger) {
      Logger.logger = input.logger;
      if (typeof Logger.logger.setLogLevels === "function") {
        Logger.logger.setLogLevels(levels);
      }
    } else {
      const current = Logger.logger;
      if (current instanceof ConsoleLogger) {
        current.setLogLevels(levels);
        current.configure(input?.options);
      } else if (typeof current.setLogLevels === "function") {
        current.setLogLevels(levels);
      }
    }
  }

  static useLogger(logger: LoggerService): void {
    Logger.logger = logger;
    if (typeof logger.setLogLevels === "function") {
      logger.setLogLevels(Logger.levels);
    }
  }

  static setLogLevels(levels: LogLevel[]): void {
    Logger.levels = levels;
    if (typeof Logger.logger.setLogLevels === "function") {
      Logger.logger.setLogLevels(levels);
    }
  }

  static overrideLogger(levelsOrBool: LogLevel[] | boolean): void {
    if (Array.isArray(levelsOrBool)) {
      Logger.setLogLevels(levelsOrBool);
    } else {
      Logger.setLogLevels(
        levelsOrBool ? [...DEBUG_LEVELS] : [...DEFAULT_LEVELS]
      );
    }
  }

  log(message: any, context?: string): void {
    Logger.log(message, context ?? this.context);
  }
  error(message: any, trace?: ErrorLike, context?: string): void {
    Logger.error(message, trace, context ?? this.context);
  }
  warn(message: any, context?: string): void {
    Logger.warn(message, context ?? this.context);
  }
  debug(message: any, context?: string): void {
    Logger.debug(message, context ?? this.context);
  }
  verbose(message: any, context?: string): void {
    Logger.verbose(message, context ?? this.context);
  }

  static log(message: any, context?: string): void {
    Logger.logger.log(message, context);
  }
  static error(message: any, trace?: ErrorLike, context?: string): void {
    Logger.logger.error(message, trace as any, context);
  }
  static warn(message: any, context?: string): void {
    Logger.logger.warn(message, context);
  }
  static debug(message: any, context?: string): void {
    if (typeof (Logger.logger as any).debug === "function") {
      (Logger.logger as any).debug(message, context);
    }
  }
  static verbose(message: any, context?: string): void {
    if (typeof (Logger.logger as any).verbose === "function") {
      (Logger.logger as any).verbose(message, context);
    }
  }
}

export const DEFAULT_LOG_LEVELS = DEFAULT_LEVELS;
export const DEBUG_LOG_LEVELS = DEBUG_LEVELS;
