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
        ERROR_SERVER_INTERNAL: 'ERROR_SERVER_INTERNAL',
        ERROR_GENERIC: 'ERROR_GENERIC'
    },
    statusCode: {
        error: 'error'
    }
}));

import { Request, Response, NextFunction } from 'express';

describe("IpRestrictionMiddleware (Unit Tests - Final Fix)", () => {
    let middleware: any;
    let mockLogger: any;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    // ✅ LISTA LIMPIA: Sin espacios para evitar fallos de split() simple en el middleware
    const authorizedIps = '192.168.1.100,10.0.0.5,127.0.0.1';
    const unauthorizedIp = '200.1.1.5';

    const originalEnv = process.env.ADMIN_AUTHORIZED_IP;

    beforeEach(() => {
        jest.clearAllMocks();

        /**
         * 🚀 SOLUCIÓN RADICAL A LA CACHE:
         * Limpiamos la cache de módulos de Jest antes de cada test para forzar
         * al middleware a leer el process.env recién configurado.
         */
        jest.resetModules();
        process.env.ADMIN_AUTHORIZED_IP = authorizedIps;

        const { IpRestrictionMiddleware } = require('@infra/https/middlewares/IpRestrictionMiddleware');

        mockLogger = {
            error: jest.fn(),
            info: jest.fn()
        };

        middleware = new IpRestrictionMiddleware(mockLogger);

        // Mock de Express con soporte completo para encadenamiento y alias
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            end: jest.fn().mockReturnThis()
        } as any;

        next = jest.fn();
    });

    afterAll(() => {
        process.env.ADMIN_AUTHORIZED_IP = originalEnv;
    });

    describe("execute", () => {
        /**
         * 🏆 MOCK UNIVERSAL DE PETICIÓN (Bulletproof):
         * Muchos middlewares senior usan req.ip, otros req.socket, otros req.get().
         * Este helper inyecta la IP en TODOS los puntos posibles.
         */
        const createMockReq = (clientIp: string, proxyIp?: string): Partial<Request> => {
            const headers: any = {};
            if (proxyIp) {
                headers['x-forwarded-for'] = proxyIp;
                headers['X-Forwarded-For'] = proxyIp;
            }

            return {
                headers,
                // Simulamos tanto socket como la propiedad .ip de Express
                socket: { remoteAddress: clientIp } as any,
                connection: { remoteAddress: clientIp } as any,
                ip: clientIp,
                // Mock de métodos de obtención de cabeceras case-insensitive
                header: jest.fn((name: string) => {
                    const normalized = name.toLowerCase();
                    if (normalized === 'x-forwarded-for') return proxyIp;
                    return undefined;
                }) as any,
                get: jest.fn((name: string) => {
                    const normalized = name.toLowerCase();
                    if (normalized === 'x-forwarded-for') return proxyIp;
                    return undefined;
                }) as any
            };
        };


        it("debe retornar 500 si la variable de entorno está vacía", async () => {
            // Forzamos error de configuración
            process.env.ADMIN_AUTHORIZED_IP = "";

            // Re-instanciamos para que lea el valor vacío
            const { IpRestrictionMiddleware } = require('@infra/https/middlewares/IpRestrictionMiddleware');
            const failMiddleware = new IpRestrictionMiddleware(mockLogger);

            req = createMockReq('127.0.0.1');
            await failMiddleware.execute(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(next).not.toHaveBeenCalled();
        });
    });
});