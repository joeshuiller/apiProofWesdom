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

import { MenuRoutes } from '@infra/https/routes/private/MenuRoutes';

describe("MenuRoutes (Unit Tests)", () => {
    let menuRoutes: MenuRoutes;
    let mockController: any;
    let mockAuthMiddleware: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Inicialización de mocks de dependencias
        mockController = {
            createMenu: jest.fn(),
            getAllMenus: jest.fn(),
            getMenusByRoleAndProject: jest.fn(),
            getMenuById: jest.fn(),
            updateMenu: jest.fn(),
            deleteMenu: jest.fn()
        };

        mockAuthMiddleware = {
            execute: jest.fn()
        };

        // Instanciación manual para inyectar los mocks
        menuRoutes = new MenuRoutes(mockController, mockAuthMiddleware);
    });

    describe("Constructor & Route Initialization", () => {

        it("debe inicializar el Router de Express", () => {
            const { Router } = require('express');
            expect(Router).toHaveBeenCalled();
        });

        it("debe aplicar el middleware de autenticación globalmente al router de menús", () => {
            expect(mockRouter.use).toHaveBeenCalledWith(mockAuthMiddleware.execute);
        });

        it("debe registrar la ruta POST /register vinculada a createMenu", () => {
            expect(mockRouter.post).toHaveBeenCalledWith('/register', expect.any(Function));

            const callback = (mockRouter.post as jest.Mock).mock.calls.find(call => call[0] === '/register')[1];
            const req = {} as any;
            const res = {} as any;
            const next = jest.fn();

            callback(req, res, next);
            expect(mockController.createMenu).toHaveBeenCalledWith(req, res, next);
        });

        it("debe registrar la ruta GET / vinculada a getAllMenus", () => {
            expect(mockRouter.get).toHaveBeenCalledWith('/', expect.any(Function));

            const callback = (mockRouter.get as jest.Mock).mock.calls.find(call => call[0] === '/')[1];
            callback({}, {}, {});
            expect(mockController.getAllMenus).toHaveBeenCalled();
        });

        it("debe registrar la ruta GET /filter vinculada a getMenusByRoleAndProject", () => {
            expect(mockRouter.get).toHaveBeenCalledWith('/filter', expect.any(Function));

            const callback = (mockRouter.get as jest.Mock).mock.calls.find(call => call[0] === '/filter')[1];
            callback({}, {}, {});
            expect(mockController.getMenusByRoleAndProject).toHaveBeenCalled();
        });

        it("debe registrar la ruta GET /:id vinculada a getMenuById", () => {
            expect(mockRouter.get).toHaveBeenCalledWith('/:id', expect.any(Function));

            const callback = (mockRouter.get as jest.Mock).mock.calls.find(call => call[0] === '/:id')[1];
            callback({}, {}, {});
            expect(mockController.getMenuById).toHaveBeenCalled();
        });

        it("debe registrar la ruta PUT /:id vinculada a updateMenu", () => {
            expect(mockRouter.put).toHaveBeenCalledWith('/:id', expect.any(Function));

            const callback = (mockRouter.put as jest.Mock).mock.calls.find(call => call[0] === '/:id')[1];
            callback({}, {}, {});
            expect(mockController.updateMenu).toHaveBeenCalled();
        });

        it("debe registrar la ruta DELETE /:id vinculada a deleteMenu", () => {
            expect(mockRouter.delete).toHaveBeenCalledWith('/:id', expect.any(Function));

            const callback = (mockRouter.delete as jest.Mock).mock.calls.find(call => call[0] === '/:id')[1];
            callback({}, {}, {});
            expect(mockController.deleteMenu).toHaveBeenCalled();
        });
    });
});