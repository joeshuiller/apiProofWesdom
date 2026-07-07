import "reflect-metadata";
/**
 * ✅ CONFIGURACIÓN GLOBAL DE ENTORNO PARA TESTS:
 * Prevenimos errores de validación de infraestructura al importar el orquestador.
 */
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test_user";
process.env.DB_USERNAME = "test_user";
process.env.DB_PASSWORD = "test_password";
process.env.DB_NAME = "test_db";
process.env.JWT_SECRET = "test_secret";
process.env.GEMINI_API_KEY = "uyerygreu";
process.env.ENCRYPTION_KEY = "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
process.env.ENCRYPTION_SALT = "8f1a2b3c4d5e6f7a";
// 1. Mock de Express Router antes de importar la clase
const mockRouter = {
    use: jest.fn(),
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
};

jest.mock('express', () => ({
    Router: jest.fn(() => mockRouter)
}));

// 2. Mock de Inversify y Decoradores
jest.mock("inversify", () => ({
    injectable: () => (target: any) => target,
    inject: () => (target: any, key: string, index: number) => { },
}));

import { DynamicCryptosRoutes } from '@infra/https/routes/private/DynamicCryptosRoutes';

describe("DynamicCryptosRoutes (Unit Tests)", () => {
    let dynamicCryptosRoutes: DynamicCryptosRoutes;
    let mockController: any;
    let mockAuthMiddleware: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Inicialización de mocks de dependencias
        mockController = {
            getAllByProject: jest.fn(),
            getActive: jest.fn(),
            getById: jest.fn(),
            store: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn()
        };

        mockAuthMiddleware = {
            execute: jest.fn()
        };

        // Instanciación manual para inyectar los mocks
        dynamicCryptosRoutes = new DynamicCryptosRoutes(mockController, mockAuthMiddleware);
    });

    describe("Constructor & Route Initialization", () => {

        it("debe inicializar el Router de Express", () => {
            const { Router } = require('express');
            expect(Router).toHaveBeenCalled();
        });

        it("debe aplicar el middleware de autenticación globalmente al módulo de cryptos", () => {
            expect(mockRouter.use).toHaveBeenCalledWith(mockAuthMiddleware.execute);
        });

        it("debe registrar la ruta GET /project/:projectId vinculada al controlador", () => {
            expect(mockRouter.get).toHaveBeenCalledWith('/project/:projectId', expect.any(Function));

            const callback = (mockRouter.get as jest.Mock).mock.calls.find(call => call[0] === '/project/:projectId')[1];
            callback({}, {}, {});
            expect(mockController.getAllByProject).toHaveBeenCalled();
        });

        it("debe registrar la ruta GET /active/:projectId vinculada al controlador", () => {
            expect(mockRouter.get).toHaveBeenCalledWith('/active/:projectId', expect.any(Function));

            const callback = (mockRouter.get as jest.Mock).mock.calls.find(call => call[0] === '/active/:projectId')[1];
            callback({}, {}, {});
            expect(mockController.getActive).toHaveBeenCalled();
        });

        it("debe registrar la ruta GET /:id vinculada al controlador", () => {
            expect(mockRouter.get).toHaveBeenCalledWith('/:id', expect.any(Function));

            const callback = (mockRouter.get as jest.Mock).mock.calls.find(call => call[0] === '/:id')[1];
            callback({}, {}, {});
            expect(mockController.getById).toHaveBeenCalled();
        });

        it("debe registrar la ruta POST / vinculada al controlador para creación", () => {
            expect(mockRouter.post).toHaveBeenCalledWith('/', expect.any(Function));

            const callback = (mockRouter.post as jest.Mock).mock.calls.find(call => call[0] === '/')[1];
            const req = {} as any;
            const res = {} as any;
            const next = jest.fn();

            callback(req, res, next);
            expect(mockController.store).toHaveBeenCalledWith(req, res, next);
        });

        it("debe registrar la ruta PUT /:id vinculada al controlador para actualización", () => {
            expect(mockRouter.put).toHaveBeenCalledWith('/:id', expect.any(Function));

            const callback = (mockRouter.put as jest.Mock).mock.calls.find(call => call[0] === '/:id')[1];
            callback({}, {}, {});
            expect(mockController.update).toHaveBeenCalled();
        });

        it("debe registrar la ruta DELETE /:id vinculada al controlador para eliminación física/lógica", () => {
            expect(mockRouter.delete).toHaveBeenCalledWith('/:id', expect.any(Function));

            const callback = (mockRouter.delete as jest.Mock).mock.calls.find(call => call[0] === '/:id')[1];
            callback({}, {}, {});
            expect(mockController.destroy).toHaveBeenCalled();
        });
    });
});