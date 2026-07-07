export type LogMetadata = Record<string, unknown>;

export interface ILoggerRepository {
  info(message: string, itemService: string, meta?: LogMetadata): void;
  error(message: string, itemService: string, meta?: LogMetadata): void;
  warn(message: string, itemService: string, meta?: LogMetadata,): void;
  debug(message: string, itemService: string, meta?: LogMetadata): void;
}