import "reflect-metadata";

// 1. Mock de Inversify y Decoradores
jest.mock("@infra/di/inversifyConfig", () => ({
    container: {
        get: jest.fn(),
    }
}));

jest.mock("inversify", () => ({
    injectable: () => (target: any) => target,
    inject: () => (target: any, key: string, index: number) => { },
}));

import { Response, NextFunction, Request } from 'express';
// ✅ CORRECCIÓN DE CASING (TS1149): Sincronizado con Routes.ts e inversifyConfig.ts
import { BruteForceMiddleware } from '@infra/https/middlewares/bruteForceMiddleware';
import { codeLink, statusCode } from '@core/utils/RoutersLink';

describe("BruteForceMiddleware", () => {
    let middleware: BruteForceMiddleware;

    // Mocks de dependencias
    let loggerUseCaseMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '127.0.0.1';
    const traceId = 'test-trace-id';

    beforeEach(() => {
        jest.clearAllMocks();

        // Inicialización de mocks de casos de uso
        loggerUseCaseMock = {
            error: jest.fn(),
            info: jest.fn()
        };

        bruteForceUseCaseMock = {
            checkAttemptStatus: jest.fn()
        };

        // Mock de Express con soporte para encadenamiento (.status().json())
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Instanciación manual del middleware inyectando los mocks
        middleware = new BruteForceMiddleware(loggerUseCaseMock, bruteForceUseCaseMock);
    });

    describe("execute", () => {
        it("debe permitir el acceso (llamar a next) si la IP no está bloqueada", async () => {
            req = {
                headers: {},
                socket: { remoteAddress: remoteIp } as any
            };
            bruteForceUseCaseMock.checkAttemptStatus.mockResolvedValue({ isBlocked: false });

            await middleware.execute(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.checkAttemptStatus).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("debe retornar 429 y loguear el bloqueo si la IP tiene demasiados intentos", async () => {
            req = {
                headers: { 'x-trace-id': traceId },
                socket: { remoteAddress: remoteIp } as any
            };
            bruteForceUseCaseMock.checkAttemptStatus.mockResolvedValue({
                isBlocked: true,
                remainingMinutes: 15
            });

            await middleware.execute(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(429);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: statusCode.error,
                error: expect.objectContaining({
                    code: codeLink.TOO_MANY_ATTEMPTS,
                    traceId: traceId
                })
            }));
            expect(loggerUseCaseMock.error).toHaveBeenCalledWith(
                codeLink.TOO_MANY_ATTEMPTS,
                "IP_BLOCKED",
                expect.objectContaining({ cleanIp: remoteIp, traceId })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it("debe normalizar la IP eliminando el prefijo IPv6 mapping (::ffff:)", async () => {
            req = {
                headers: {},
                socket: { remoteAddress: `::ffff:${remoteIp}` } as any
            };
            bruteForceUseCaseMock.checkAttemptStatus.mockResolvedValue({ isBlocked: false });

            await middleware.execute(req as Request, res as Response, next);

            // Verificamos que al caso de uso le llegue la IP limpia
            expect(bruteForceUseCaseMock.checkAttemptStatus).toHaveBeenCalledWith(remoteIp);
        });

        it("debe priorizar la IP de x-forwarded-for si la petición viene de un proxy", async () => {
            const proxyIp = '10.0.0.5';
            req = {
                headers: { 'x-forwarded-for': proxyIp },
                socket: { remoteAddress: remoteIp } as any
            };
            bruteForceUseCaseMock.checkAttemptStatus.mockResolvedValue({ isBlocked: false });

            await middleware.execute(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.checkAttemptStatus).toHaveBeenCalledWith(proxyIp);
        });

        it("debe retornar 500 y loguear el error crítico si el servicio de Brute Force falla", async () => {
            req = {
                headers: {},
                socket: { remoteAddress: remoteIp } as any
            };
            const error = new Error("Connection failed");
            bruteForceUseCaseMock.checkAttemptStatus.mockRejectedValue(error);

            await middleware.execute(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(loggerUseCaseMock.error).toHaveBeenCalledWith(
                codeLink.TOO_MANY_ATTEMPTS,
                expect.stringContaining("Critical Error"),
                expect.objectContaining({ error: error.message })
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: statusCode.error,
                error: expect.objectContaining({
                    code: codeLink.ERROR_SERVER_INTERNAL
                })
            }));
        });

        it("debe generar un traceId único si no se proporciona en los headers", async () => {
            req = {
                headers: {},
                socket: { remoteAddress: remoteIp } as any
            };
            bruteForceUseCaseMock.checkAttemptStatus.mockResolvedValue({
                isBlocked: true,
                remainingMinutes: 5
            });

            await middleware.execute(req as Request, res as Response, next);

            const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
            expect(jsonCall.error.traceId).toBeDefined();
            expect(typeof jsonCall.error.traceId).toBe('string');
        });
    });
});