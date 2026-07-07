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

/**
 * ✅ SOLUCIÓN AL ERROR: TypeError: express.static is not a function
 * Añadimos 'static' al mock de express para que dependencias como swagger-ui-express
 * no rompan la suite de pruebas al intentar inicializarse.
 */
jest.mock('express', () => ({
    Router: jest.fn(() => mockRouter),
    static: jest.fn()
}));

// 2. Mock de Inversify y Decoradores
jest.mock("inversify", () => ({
    injectable: () => (target: any) => target,
    inject: () => (target: any, key: string, index: number) => { },
}));

import { GenerativeAIRoutes } from '@infra/https/routes/public/GenerativeAIRoutes';

describe("GenerativeAIRoutes (Unit Tests)", () => {
    let generativeAIRoutes: GenerativeAIRoutes;
    let mockController: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Inicialización del mock del controlador de IA
        mockController = {
            compareBase64: jest.fn(),
            analyzeReceipt: jest.fn(),
            generateContent: jest.fn()
        };

        // Instanciación manual para inyectar el mock del controlador
        generativeAIRoutes = new GenerativeAIRoutes(mockController);
    });

    describe("Constructor & Route Initialization", () => {

        it("debe inicializar el Router de Express", () => {
            const { Router } = require('express');
            expect(Router).toHaveBeenCalled();
        });

        it("debe registrar la ruta POST /compare-base64 vinculada al controlador", () => {
            expect(mockRouter.post).toHaveBeenCalledWith('/compare-base64', expect.any(Function));

            // Simulación de ejecución del callback del router para validar la delegación
            const callback = (mockRouter.post as jest.Mock).mock.calls.find(call => call[0] === '/compare-base64')[1];
            const req = {} as any;
            const res = {} as any;
            const next = jest.fn();

            callback(req, res, next);
            expect(mockController.compareBase64).toHaveBeenCalledWith(req, res, next);
        });

        it("debe registrar la ruta POST /analyze-receipt vinculada al controlador", () => {
            expect(mockRouter.post).toHaveBeenCalledWith('/analyze-receipt', expect.any(Function));

            const callback = (mockRouter.post as jest.Mock).mock.calls.find(call => call[0] === '/analyze-receipt')[1];
            const req = {} as any;
            const res = {} as any;
            const next = jest.fn();

            callback(req, res, next);
            expect(mockController.analyzeReceipt).toHaveBeenCalledWith(req, res, next);
        });

        it("debe registrar la ruta POST /generate-content vinculada al controlador", () => {
            expect(mockRouter.post).toHaveBeenCalledWith('/generate-content', expect.any(Function));

            const callback = (mockRouter.post as jest.Mock).mock.calls.find(call => call[0] === '/generate-content')[1];
            const req = {} as any;
            const res = {} as any;
            const next = jest.fn();

            callback(req, res, next);
            expect(mockController.generateContent).toHaveBeenCalledWith(req, res, next);
        });
    });
});