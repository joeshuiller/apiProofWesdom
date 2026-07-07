import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DomainError } from '../../../core/errors/DomainError';
import { codeLink, codeServices, statusCode } from '../../../core/utils/RoutersLink';
import { LoggerUseCase } from '@app/use-cases/LoggerUseCase';
import { TYPES } from '@app/dtos/models/types';
import { RoleAlreadyExists } from '@core/errors/type/RoleAlreadyExists';
import { InsufficientFundsError } from '@core/errors/type/InsufficientFundsError';

/**
 * GlobalErrorHandler
 * Clase inyectable encargada de capturar y procesar todos los errores de la aplicación.
 * Transforma errores de dominio en respuestas HTTP adecuadas y oculta detalles técnicos
 * en errores inesperados por seguridad.
 */
@injectable()
export class GlobalErrorHandler {
  constructor(
    @inject(TYPES.LoggerUseCase) private readonly logger: LoggerUseCase
  ) { }

  /**
   * Mapea excepciones de la capa de Dominio a códigos de estado HTTP.
   */
  private mapDomainErrorToHttp(error: DomainError): number {
    const mapping: Record<string, number> = {
      InsufficientFundsError: 400,
      RoleAlreadyExists: 409,
      UserNotFound: 404,
      InvalidArgumentError: 400,
      UnauthorizedError: 401
    };
    return mapping[error.constructor.name] ?? 400; // 400 Bad Request por defecto para reglas de negocio
  }

  /**
   * Middleware de error de Express.
   * IMPORTANTE: Debe mantener los 4 argumentos para ser reconocido por Express como ErrorHandler.
   */
  public execute = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // 1. Normalizamos el Trace ID para trazabilidad entre servicios
    const headerTraceId = req.headers['x-trace-id'];
    const traceId = (Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId) || uuidv4();

    // 2. Si Express ya envió los headers, delegamos al manejador por defecto
    if (res.headersSent) {
      return next(err);
    }

    // 3. Manejo de Errores de Dominio (Controlados y Semánticos)
    if (err instanceof DomainError) {
      const errorCode = this.mapDomainErrorToHttp(err);

      this.logger.error(
        codeLink.ERROR_GENERIC,
        err.constructor.name,
        {
          code: errorCode,
          message: err.message,
          traceId: traceId
        }
      );

      res.status(errorCode).json({
        status: statusCode.error,
        error: {
          code: err.constructor.name,
          message: err.message,
          traceId: traceId
        }
      });
      return;
    }

    // 4. Errores Inesperados (Bugs o fallos de infraestructura)
    // Logueamos el detalle técnico para auditoría interna
    this.logger.error(
      codeLink.ERROR_SERVER_INTERNAL,
      err.constructor.name,
      {
        code: codeLink.ERROR_SERVER_INTERNAL,
        message: err.message,
        traceId: traceId
      }
    );

    // Enviamos una respuesta genérica al cliente para evitar fugas de información (CWE-209)
    res.status(500).json({
      status: statusCode.error,
      error: {
        code: codeLink.ERROR_SERVER_INTERNAL,
        message: codeServices.serverError,
        traceId: traceId
      }
    });
  };
}