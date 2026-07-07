import "reflect-metadata";

// 1. Mock de Inversify y Decoradores
jest.mock("@infra/di/inversifyConfig", () => ({
    container: { get: jest.fn() }
}));

jest.mock("inversify", () => ({
    injectable: () => (target: any) => target,
    inject: () => (target: any, key: string, index: number) => { },
}));

/**
 * ✅ CONFIGURACIÓN DE ENTORNO PARA TESTS:
 */
process.env.ENCRYPTION_KEY = "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
process.env.ENCRYPTION_SALT = "8f1a2b3c4d5e6f7a";

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidateMiddleware } from '@infra/https/middlewares/ValidateData';
import { codeLink, codeServices, statusCode } from '@core/utils/RoutersLink';

describe("ValidateMiddleware", () => {
    let middleware: ValidateMiddleware;
    let mockLogger: any;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    // Esquema de ejemplo para las pruebas
    const testSchema = z.object({
        name: z.string().min(1, "El nombre es requerido"),
        age: z.number().positive("La edad debe ser positiva")
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Inicialización de mock del Logger
        mockLogger = {
            error: jest.fn(),
            info: jest.fn()
        };

        // Mock de Express con encadenamiento
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        next = jest.fn();

        // Instanciación manual inyectando el mock del logger
        middleware = new ValidateMiddleware(mockLogger);
    });

    describe("handle (Validation Logic)", () => {

        it("debe permitir el paso (next) y limpiar el body si los datos son válidos", () => {
            req = {
                headers: {},
                body: { name: "John Doe", age: 30, extraField: "should be removed" }
            };

            const handler = middleware.handle(testSchema);
            handler(req as Request, res as Response, next);

            // Verificamos que se llame a next()
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();

            // Verificamos que Zod haya limpiado el campo 'extraField' que no estaba en el schema
            expect(req.body).toEqual({ name: "John Doe", age: 30 });
            expect(req.body).not.toHaveProperty('extraField');
        });

        it("debe retornar 400 y loguear el error si la validación de Zod falla", () => {
            const traceId = 'uuid-test-123';
            req = {
                headers: { 'x-trace-id': traceId },
                body: { name: "", age: -5 } // Datos inválidos
            };

            const handler = middleware.handle(testSchema);
            handler(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: statusCode.error,
                error: expect.objectContaining({
                    code: codeLink.ERROR_VALID_DATA,
                    traceId: traceId
                })
            }));

            // Verificamos que el error se haya registrado en el logger
            expect(mockLogger.error).toHaveBeenCalledWith(
                codeLink.ERROR_VALID_DATA,
                codeServices.validError,
                expect.objectContaining({ traceId })
            );

            expect(next).not.toHaveBeenCalled();
        });

        it("debe utilizar un Trace ID autogenerado si no se proporciona en los headers", () => {
            req = {
                headers: {},
                body: { name: "" } // Forzamos error para ver la respuesta
            };

            const handler = middleware.handle(testSchema);
            handler(req as Request, res as Response, next);

            const responseBody = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseBody.error.traceId).toBeDefined();
            expect(typeof responseBody.error.traceId).toBe("string");
        });

        it("debe retornar 500 ante un error inesperado (fuera de ZodError)", () => {
            req = { headers: {}, body: {} };

            // Simulamos un error inesperado inyectando un schema que lance una excepción genérica
            const brokenSchema = {
                parse: jest.fn(() => { throw new Error("Unexpected System Crash"); })
            } as any;

            const handler = middleware.handle(brokenSchema);
            handler(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(mockLogger.error).toHaveBeenCalledWith(
                codeLink.ERROR_SERVER_INTERNAL,
                codeServices.serverError,
                expect.objectContaining({ message: "Unexpected System Crash" })
            );
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.objectContaining({
                    code: codeLink.ERROR_SERVER_INTERNAL
                })
            }));
        });
    });
});