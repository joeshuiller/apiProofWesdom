import { TYPES } from "@app/dtos/models/types";
import { ILoggerRepository, LogMetadata } from "@domain/repositories/ILoggerRepository";
import { inject, injectable } from "inversify";


@injectable()
export class LoggerUseCase {
  constructor(
    @inject(TYPES.ILoggerRepository) private logger: ILoggerRepository
  ) {}
  
  info(message: string, itemService:string, meta?: LogMetadata): void {
    this.logger.info(message, itemService, meta);
  }

  error(message: string, itemService:string, meta?: LogMetadata): void {
    this.logger.error(message, itemService, meta);
  }

  warn(message: string, itemService:string, meta?: LogMetadata): void {
    this.logger.warn(message, itemService, meta);
  }

  debug(message: string, itemService:string, meta?: LogMetadata): void {
    this.logger.debug(message, itemService, meta);
  }

}