import "reflect-metadata";

// 1. Mock de Inversify y Decoradores
jest.mock("@infra/di/inversifyConfig", () => ({
    container: { get: jest.fn() }
}));

jest.mock("inversify", () => ({
    injectable: () => (target: any) => target,
    inject: () => (target: any, key: string, index: number) => { },
}));

// 2. Mock de dependencias de utilidad
jest.mock('@core/utils/RoutersLink', () => ({
    codeLink: {
        ERROR_GENERIC: 'ERROR_GENERIC',
        ERROR_SERVER_INTERNAL: 'ERROR_SERVER_INTERNAL'
    },
    codeServices: {
        serverError: 'Internal Server Error'
    },
    statusCode: {
        error: 'error'
    }
}));

import { Request, Response, NextFunction } from 'express';
import { GlobalErrorHandler } from '@infra/https/middlewares/GlobalErrorHandler';
import { DomainError } from '@core/errors/DomainError';

// Definición de errores de dominio para pruebas
class UserNotFound extends DomainError { constructor() { super("Usuario no encontrado"); } }
class UnauthorizedError extends DomainError { constructor() { super("No autorizado"); } }
class UnknownDomainError extends DomainError { constructor() { super("Error desconocido"); } }

describe("GlobalErrorHandler (Unit Tests)", () => {
    let errorHandler: GlobalErrorHandler;
    let mockLogger: any;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        jest.clearAllMocks();

        // Inicialización del mock del Logger
        mockLogger = {
            error: jest.fn(),
            info: jest.fn()
        };

        // Mock de Express con encadenamiento
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            headersSent: false
        };

        next = jest.fn();

        // Instanciación manual inyectando el logger
        errorHandler = new GlobalErrorHandler(mockLogger);
    });

    describe("execute", () => {

        it("debe manejar un DomainError (UserNotFound) y mapear a HTTP 404", () => {
            const error = new UserNotFound();
            req = { headers: {} };

            errorHandler.execute(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    code: 'UserNotFound',
                    message: "Usuario no encontrado"
                })
            }));
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it("debe manejar un DomainError (UnauthorizedError) y mapear a HTTP 401", () => {
            const error = new UnauthorizedError();
            req = { headers: {} };

            errorHandler.execute(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it("debe mapear a HTTP 400 si el DomainError no está explícitamente en el mapa", () => {
            const error = new UnknownDomainError();
            req = { headers: {} };

            errorHandler.execute(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        it("debe manejar errores genéricos de Node (Error) con HTTP 500", () => {
            const error = new Error("Database connection timeout");
            req = { headers: {} };

            errorHandler.execute(error, req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    code: 'ERROR_SERVER_INTERNAL'
                })
            }));
            // Verificamos que se logueó el error técnico real para auditoría
            expect(mockLogger.error).toHaveBeenCalledWith(
                'ERROR_SERVER_INTERNAL',
                'Error',
                expect.objectContaining({ message: "Database connection timeout" })
            );
        });

        it("debe delegar al manejador por defecto (next) si los headers ya fueron enviados", () => {
            const error = new Error("Late error");
            res.headersSent = true;
            req = { headers: {} };

            errorHandler.execute(error, req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.status).not.toHaveBeenCalled();
        });

        it("debe persistir el x-trace-id proporcionado en el header", () => {
            const traceId = "uuid-de-rastreo-existente";
            const error = new Error("Test trace");
            req = { headers: { 'x-trace-id': traceId } };

            errorHandler.execute(error, req as Request, res as Response, next);

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({ traceId })
            );

            const responseBody = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseBody.error.traceId).toBe(traceId);
        });

        it("debe generar un nuevo traceId si no viene en los encabezados", () => {
            const error = new Error("Test trace generation");
            req = { headers: {} };

            errorHandler.execute(error, req as Request, res as Response, next);

            const responseBody = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseBody.error.traceId).toBeDefined();
            expect(typeof responseBody.error.traceId).toBe("string");
        });
    });
});