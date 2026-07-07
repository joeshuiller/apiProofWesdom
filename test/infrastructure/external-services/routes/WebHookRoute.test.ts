
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
// 1. Mockeamos el contenedor para evitar errores de reflect-metadata
jest.mock("@infra/di/inversifyConfig", () => ({
    container: {
        get: jest.fn(),
        snapshot: jest.fn(),
        restore: jest.fn()
    }
}));

// Mock del middleware de validación
jest.mock("@infra/https/middlewares/ValidateData", () => ({
    validate: jest.fn(() => (req: any, res: any, next: any) => next())
}));

import { WebHookRoutes } from "@infra/external-services/routes/WebHookRoute";

describe("WebHookRoutes", () => {
    let webHookRoutes: WebHookRoutes;
    let controllerMock: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del controlador
        controllerMock = {
            create: jest.fn(),
            findByIdWhatsapp: jest.fn(),
            handleIncoming: jest.fn(),
            verifyWebhook: jest.fn()
        };

        webHookRoutes = new WebHookRoutes(controllerMock);
    });

    it("should initialize the router instance", () => {
        expect(webHookRoutes.router).toBeDefined();
    });

    // Helper para buscar capas de ruta en el stack de Express
    const findLayer = (path: string, method: string) =>
        webHookRoutes.router.stack.find((s: any) => s.route?.path === path && s.route?.methods[method]);

    describe("WebHook Endpoints Mappings", () => {

        it("should map POST /register to controller.create", async () => {
            const req = { body: { url: "http://test.com" } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            const layer = findLayer("/register", "post");
            expect(layer).toBeDefined();
            expect(layer!.route).toBeDefined();

            // ✅ Ejecutamos el controlador (último en el stack de la ruta)
            const stack = layer!.route!.stack;
            const finalHandler = stack[stack.length - 1].handle;
            await finalHandler(req, res, next);

            expect(controllerMock.create).toHaveBeenCalledWith(
                expect.objectContaining({ body: req.body }),
                res,
                next
            );
        });

        it("should map GET /:id to controller.findByIdWhatsapp", async () => {
            const req = { params: { id: "12345" } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            const layer = findLayer("/:id", "get");
            expect(layer).toBeDefined();
            expect(layer!.route).toBeDefined();

            const stack = layer!.route!.stack;
            const finalHandler = stack[stack.length - 1].handle;
            await finalHandler(req, res, next);

            expect(controllerMock.findByIdWhatsapp).toHaveBeenCalledWith(
                expect.objectContaining({ params: req.params }),
                res,
                next
            );
        });

        it("should map POST /whatsapp to controller.handleIncoming", async () => {
            const req = { body: { object: "whatsapp_business_account" } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            const layer = findLayer("/whatsapp", "post");
            expect(layer).toBeDefined();
            expect(layer!.route).toBeDefined();

            const stack = layer!.route!.stack;
            const finalHandler = stack[stack.length - 1].handle;
            await finalHandler(req, res, next);

            expect(controllerMock.handleIncoming).toHaveBeenCalledWith(
                expect.objectContaining({ body: req.body }),
                res,
                next
            );
        });

        it("should map GET /whatsapp to controller.verifyWebhook", async () => {
            const req = { query: { "hub.mode": "subscribe" } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            const layer = findLayer("/whatsapp", "get");
            expect(layer).toBeDefined();
            expect(layer!.route).toBeDefined();

            const stack = layer!.route!.stack;
            const finalHandler = stack[stack.length - 1].handle;
            await finalHandler(req, res, next);

            expect(controllerMock.verifyWebhook).toHaveBeenCalledWith(
                expect.objectContaining({ query: req.query }),
                res,
                next
            );
        });
    });
});