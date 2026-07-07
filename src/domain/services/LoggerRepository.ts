import dotenv from "dotenv";
import { ILoggerRepository, LogMetadata } from "../repositories/ILoggerRepository";
import winston, { Logger as WinstonInstance, format, transports } from 'winston';
import path from 'path';
import { injectable } from "inversify";
import { configEnv } from "@infra/config/env";

@injectable()
export class LoggerRepository implements ILoggerRepository {
  private readonly logger: WinstonInstance;

  constructor() {
    // 💡 Tip de Senior: Aunque dotenv.config() funciona aquí, la mejor práctica 
    // es llamarlo una sola vez en la primera línea de tu archivo principal (ej. index.ts)
    dotenv.config();

    // 1. EL TRUCO DE ORO: Usar process.cwd() en lugar de __dirname
    // Esto asegura que la carpeta 'logs' se cree donde está corriendo la app, no en la raíz del servidor.
    const logDirectory = path.join(process.cwd(), 'config/logs');

    // 2. Preparamos los "transportes" de forma dinámica
    const customTransports: winston.transport[] = [];

    if (configEnv.NODE_ENV === 'production') {
      // 🚀 PRODUCCIÓN: Guardamos todo en archivos silenciosamente
      customTransports.push(
        new transports.File({
          filename: path.join(logDirectory, 'error.log'),
          level: 'error'
        }),
        new transports.File({
          filename: path.join(logDirectory, 'combined.log')
        })
      );
    } else {
      // 💻 DESARROLLO: Mostramos en consola con colores y no creamos archivos basura
      customTransports.push(
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      );
    }

    // 3. Inicializamos Winston
    this.logger = winston.createLogger({
      level: configEnv.LOG_LEVEL || 'info', // Fallback por si la variable viene vacía
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }), // ¡Excelente detalle para atrapar el stack trace real!
        format.json()
      ),
      transports: customTransports,
    });
  }

  info(message: string, itemService: string, meta?: LogMetadata): void {
    this.logger.info(`[EVENT]: ${message}`, {
      ...meta,
      env: configEnv.NODE_ENV,
      service: itemService
    });
  }

  error(message: string, itemService: string, meta?: LogMetadata): void {
    this.logger.error(`[EVENT]: ${message}`, {
      ...meta,
      env: configEnv.NODE_ENV,
      service: itemService
    });
  }

  warn(message: string, itemService: string, meta?: LogMetadata): void {
    this.logger.warn(`[EVENT]: ${message}`, {
      ...meta,
      env: configEnv.NODE_ENV,
      service: itemService
    });
  }

  debug(message: string, itemService: string, meta?: LogMetadata): void {
    this.logger.debug(`[EVENT]: ${message}`, {
      ...meta,
      env: configEnv.NODE_ENV,
      service: itemService
    });
  }
}