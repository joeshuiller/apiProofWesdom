import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { codeLink, codeServices, statusCode } from '@core/utils/RoutersLink';
import { LoggerUseCase } from '@app/use-cases/LoggerUseCase';
import { TYPES } from '@app/dtos/models/types';

/**
 * ValidateMiddleware
 * Clase inyectable encargada de la validación de esquemas Zod.
 * Utiliza inyección de dependencias para el registro de logs y 
 * asegura la integridad de los datos antes de llegar a los controladores.
 */
@injectable()
export class ValidateMiddleware {
    constructor(
        @inject(TYPES.LoggerUseCase) private readonly logger: LoggerUseCase
    ) { }

    /**
     * Genera un middleware de Express para validar el cuerpo de la petición.
     * @param schema Esquema de Zod a validar.
     */
    public handle = (schema: ZodObject<any>) => {
        return (req: Request, res: Response, next: NextFunction): void => {
            // 1. Identificación y trazabilidad
            const headerTraceId = req.headers['x-trace-id'];
            const traceId = (Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId) || uuidv4();

            try {
                // 2. Validación y saneamiento de datos
                // Reasignamos el body con los datos ya parseados (limpia campos extra no definidos)
                req.body = schema.parse(req.body);
                next();
            } catch (error) {
                // 3. Manejo de errores de validación (Zod)
                if (error instanceof ZodError) {
                    const errorMessages = error.issues.map(issue => ({
                        path: issue.path.join('.'),
                        message: issue.message
                    }));

                    this.logger.error(
                        codeLink.ERROR_VALID_DATA,
                        codeServices.validError,
                        {
                            message: JSON.stringify(errorMessages),
                            traceId: traceId
                        }
                    );

                    res.status(400).json({
                        status: statusCode.error,
                        error: {
                            code: codeLink.ERROR_VALID_DATA,
                            message: errorMessages,
                            traceId: traceId
                        }
                    });
                    return;
                }

                // 4. Fallback para errores inesperados durante el parseo
                this.logger.error(
                    codeLink.ERROR_SERVER_INTERNAL,
                    codeServices.serverError,
                    {
                        message: error instanceof Error ? error.message : "Error inesperado en validación",
                        traceId: traceId
                    }
                );

                res.status(500).json({
                    status: statusCode.error,
                    error: {
                        code: codeLink.ERROR_SERVER_INTERNAL,
                        message: codeServices.serverError,
                        traceId: traceId
                    }
                });
            }
        };
    };
}