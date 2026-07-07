import { injectable, inject } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TYPES } from '@app/dtos/models/types';
import { LoggerUseCase } from '@app/use-cases/LoggerUseCase';
import { codeLink, statusCode } from '../../../core/utils/RoutersLink';

@injectable()
export class IpRestrictionMiddleware {
    constructor(
        @inject(TYPES.LoggerUseCase) private readonly logger: LoggerUseCase
    ) { }

    /**
     * Valida que la IP de origen se encuentre dentro de la lista blanca del archivo .env
     */
    public execute = (req: Request, res: Response, next: NextFunction): void | Response => {
        const headerTraceId = req.headers['x-trace-id'];
        const traceId = (Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId) || uuidv4();

        // 1. Obtener la IP real de forma robusta (soporta Cloudflare, Nginx y conexiones directas)
        const clientIp = this.getCleanClientIp(req);

        // 2. Obtener lista blanca desde el .env (Cargando la nueva variable en plural)
        const authorizedIpsRaw = process.env.ADMIN_AUTHORIZED_IPS;

        if (!authorizedIpsRaw) {
            this.logger.error(
                codeLink.ERROR_SERVER_INTERNAL,
                "CONFIG_MISSING",
                { message: "ADMIN_AUTHORIZED_IPS no definida en el entorno", traceId }
            );
            return res.status(500).json({
                status: statusCode.error,
                error: { code: "CONFIG_ERROR", message: "Error de configuración de seguridad del servidor.", traceId }
            });
        }

        // 3. Convertir el string del .env en un Array de JavaScript limpio y sin espacios
        // Ejemplo: "127.0.0.1, 192.168.1.1" => ["127.0.0.1", "192.168.1.1"]
        const allowedIpArray = authorizedIpsRaw.split(',').map(ip => ip.trim());

        // 4. Verificación de Seguridad: Comprobar si la IP del cliente está en la lista blanca
        const isIpAllowed = allowedIpArray.includes(clientIp);
        console.log('ip', authorizedIpsRaw, clientIp, allowedIpArray, isIpAllowed)
        if (!isIpAllowed) {
            this.logger.error(codeLink.ERROR_GENERIC, "UNAUTHORIZED_IP_ACCESS", {
                attemptedIp: clientIp,
                allowedIps: allowedIpArray,
                traceId
            });

            return res.status(403).json({
                status: statusCode.error,
                error: {
                    code: "ACCESS_DENIED",
                    message: "Acceso denegado: Esta ruta solo puede ser utilizada por IPs administrativas autorizadas.",
                    traceId: traceId
                }
            });
        }

        return next();
    };

    /**
     * Extrae de forma limpia la IP evitando mapeos de IPv6 locales como ::ffff: o listas proxy
     */
    private getCleanClientIp(req: Request): string {
        const cfIp = req.headers["cf-connecting-ip"] as string;
        const forwardedFor = req.headers["x-forwarded-for"] as string;
        const realIp = req.headers["x-real-ip"] as string;

        let rawIp = cfIp || realIp || (forwardedFor ? forwardedFor.split(',')[0] : null) || req.socket.remoteAddress || '127.0.0.1';

        // Normalizar mapeo IPv6 de Localhost
        if (rawIp === "::1") return "127.0.0.1";

        // Quitar el prefijo ::ffff: si Node mapea una IPv4 como IPv6
        if (rawIp.startsWith("::ffff:")) {
            rawIp = rawIp.substring(7);
        }

        return rawIp.trim();
    }
}