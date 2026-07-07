import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TYPES } from '@app/dtos/models/types';
import { LoggerUseCase } from '@app/use-cases/LoggerUseCase';
import { BruteForceUseCase } from '@app/use-cases/BruteForceUseCase';
import { codeLink, statusCode } from '@core/utils/RoutersLink';

@injectable()
export class BruteForceMiddleware {
    constructor(
        @inject(TYPES.LoggerUseCase) private readonly logger: LoggerUseCase,
        @inject(TYPES.BruteForceUseCase) private readonly bruteForce: BruteForceUseCase
    ) { }

    /**
     * El método handler debe ser una arrow function para preservar el contexto de 'this'
     * al ser pasado como referencia en el Router de Express.
     */
    public execute = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        const headerTraceId = req.headers['x-trace-id'];
        const traceId = (Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId) || uuidv4();

        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
        const cleanIp = clientIp.replace(/^.*:/, '');

        try {
            const status = await this.bruteForce.checkAttemptStatus(cleanIp);

            if (status.isBlocked) {
                this.logger.error(codeLink.TOO_MANY_ATTEMPTS, "IP_BLOCKED", { cleanIp, traceId });

                return res.status(429).json({
                    status: statusCode.error,
                    error: {
                        code: codeLink.TOO_MANY_ATTEMPTS,
                        message: `Acceso restringido temporalmente. Intente de nuevo en ${status.remainingMinutes} minutos.`,
                        traceId: traceId
                    }
                });
            }

            return next();
        } catch (error: any) {
            this.logger.error(codeLink.TOO_MANY_ATTEMPTS, "[BruteForceMiddleware] Critical Error", {
                cleanIp,
                traceId,
                error: error instanceof Error ? error.message : error
            });

            return res.status(500).json({
                status: statusCode.error,
                error: {
                    code: codeLink.ERROR_SERVER_INTERNAL,
                    message: error.message || "Internal Security Provider Error",
                    traceId: traceId
                }
            });
        }
    };
}