import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from 'jsonwebtoken';
import { LoggerUseCase } from '@app/use-cases/LoggerUseCase';
import { JwtUseCase } from '@app/use-cases/JwtUseCase';
import { TYPES } from '@app/dtos/models/types';
import { codeLink, codeServices, statusCode } from '@core/utils/RoutersLink';

/**
 * Interface para peticiones que requieren el payload del token decodificado.
 */
export interface AuthenticatedRequest extends Request {
    token?: string | JwtPayload;
}

/**
 * AuthMiddleware
 * Clase inyectable encargada de la validación de tokens JWT.
 * Asegura que las rutas protegidas cuenten con una identidad válida antes de 
 * permitir el acceso a los controladores.
 */
@injectable()
export class AuthMiddleware {
    constructor(
        @inject(TYPES.JwtUseCase) private readonly jwtUseCase: JwtUseCase,
        @inject(TYPES.LoggerUseCase) private readonly logger: LoggerUseCase
    ) { }

    /**
     * Ejecuta la validación del token de autorización.
     * Se utiliza una arrow function para preservar el contexto de 'this' al ser
     * invocado por el orquestador de rutas de Express.
     */
    public execute = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        // 1. Manejo seguro del Trace ID para trazabilidad
        const headerTraceId = req.headers['x-trace-id'];
        const traceId = (Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId) || uuidv4();

        // 2. Extracción de la cabecera Authorization
        const authHeader = req.headers.authorization;

        // 3. Validación de formato (Bearer Schema)
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            this.logger.error(
                codeLink.ERROR_INVALID_TOKEN,
                codeServices.unauthorized,
                { message: 'Cabecera de autorización faltante o mal formateada', traceId: traceId }
            );

            res.status(401).json({
                status: statusCode.error,
                error: {
                    code: codeLink.ERROR_INVALID_TOKEN,
                    message: codeServices.unauthorized,
                    traceId: traceId
                }
            });
            return;
        }

        const token = authHeader.split(' ')[1];
        try {
            // 4. Verificación técnica y de expiración del Token
            const payload = await this.jwtUseCase.verifyToken(token);
            // 5. Inyección de la identidad en el objeto request y continuación del flujo
            req.token = payload;
            return next();
        } catch (error) {
            // 6. Registro de error de seguridad (Token expirado o manipulado)
            this.logger.error(
                codeLink.ERROR_INVALID_TOKEN,
                codeServices.invalidToken,
                {
                    message: error instanceof Error ? error.message : codeServices.invalidToken,
                    traceId: traceId
                }
            );

            res.status(401).json({
                status: statusCode.error,
                error: {
                    code: codeLink.ERROR_INVALID_TOKEN,
                    message: codeServices.invalidToken,
                    traceId: traceId
                }
            });
        }
    };
}