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

/**
 * ✅ CONFIGURACIÓN GLOBAL DE ENTORNO PARA TESTS:
 * Definimos valores para evitar errores colaterales de infraestructura.
 */
process.env.ENCRYPTION_KEY = "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
process.env.ENCRYPTION_SALT = "8f1a2b3c4d5e6f7a";

import { Response, NextFunction } from 'express';
import { AuthMiddleware, AuthenticatedRequest } from '@infra/https/middlewares/AuthMiddleware';
import { codeLink, codeServices, statusCode } from '@core/utils/RoutersLink';

describe("AuthMiddleware", () => {
    let middleware: AuthMiddleware;

    // Mocks de dependencias
    let jwtUseCaseMock: any;
    let loggerUseCaseMock: any;

    let req: Partial<AuthenticatedRequest>;
    let res: Partial<Response>;
    let next: NextFunction;

    const mockPayload = { userId: "123", role: "ADMIN" };
    const validToken = "valid.jwt.token";
    const bearerToken = `Bearer ${validToken}`;

    beforeEach(() => {
        jest.clearAllMocks();

        // Inicialización de mocks
        jwtUseCaseMock = {
            verifyToken: jest.fn()
        };

        loggerUseCaseMock = {
            error: jest.fn(),
            info: jest.fn()
        };

        // Mock de Express
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Instanciación manual inyectando los mocks
        middleware = new AuthMiddleware(jwtUseCaseMock, loggerUseCaseMock);
    });

    describe("execute", () => {
        it("debe permitir el acceso si el token es válido y está bien formateado", () => {
            req = {
                headers: { authorization: bearerToken },
                socket: {} as any
            };
            jwtUseCaseMock.verifyToken.mockReturnValue(mockPayload);

            middleware.execute(req as AuthenticatedRequest, res as Response, next);

            expect(jwtUseCaseMock.verifyToken).toHaveBeenCalledWith(validToken);
            expect(req.token).toEqual(mockPayload);
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it("debe retornar 401 si falta la cabecera de autorización", () => {
            req = { headers: {}, socket: {} as any };

            middleware.execute(req as AuthenticatedRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: statusCode.error,
                error: expect.objectContaining({
                    code: codeLink.ERROR_INVALID_TOKEN
                })
            }));
            expect(loggerUseCaseMock.error).toHaveBeenCalledWith(
                codeLink.ERROR_INVALID_TOKEN,
                codeServices.unauthorized,
                expect.any(Object)
            );
            expect(next).not.toHaveBeenCalled();
        });

        it("debe retornar 401 si el token no comienza con 'Bearer '", () => {
            req = {
                headers: { authorization: "Basic base64creds" },
                socket: {} as any
            };

            middleware.execute(req as AuthenticatedRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it("debe retornar 401 y loguear el error si la verificación del token falla (Expirado/Invalido)", () => {
            req = {
                headers: { authorization: bearerToken },
                socket: {} as any
            };
            const jwtError = new Error("jwt expired");
            jwtUseCaseMock.verifyToken.mockImplementation(() => { throw jwtError; });

            middleware.execute(req as AuthenticatedRequest, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(loggerUseCaseMock.error).toHaveBeenCalledWith(
                codeLink.ERROR_INVALID_TOKEN,
                codeServices.invalidToken,
                expect.objectContaining({ message: "jwt expired" })
            );
            expect(next).not.toHaveBeenCalled();
        });

        it("debe utilizar el x-trace-id del header para la trazabilidad si está presente", () => {
            const customTraceId = "uuid-trazabilidad-123";
            req = {
                headers: {
                    authorization: bearerToken,
                    "x-trace-id": customTraceId
                },
                socket: {} as any
            };
            jwtUseCaseMock.verifyToken.mockImplementation(() => { throw new Error("Fail"); });

            middleware.execute(req as AuthenticatedRequest, res as Response, next);

            expect(loggerUseCaseMock.error).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({ traceId: customTraceId })
            );

            const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
            expect(jsonCall.error.traceId).toBe(customTraceId);
        });

        it("debe generar un Trace ID aleatorio si no viene en los headers", () => {
            req = { headers: { authorization: "bad" }, socket: {} as any };

            middleware.execute(req as AuthenticatedRequest, res as Response, next);

            const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
            expect(jsonCall.error.traceId).toBeDefined();
            expect(typeof jsonCall.error.traceId).toBe("string");
        });
    });
});