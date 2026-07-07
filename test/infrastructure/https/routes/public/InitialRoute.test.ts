// 1. Mockeamos el contenedor ANTES de importar nada
jest.mock("@infra/di/inversifyConfig", () => ({
    container: {
        get: jest.fn(),
        snapshot: jest.fn(),
        restore: jest.fn()
    }
}));
/**
 * ✅ CONFIGURACIÓN GLOBAL DE ENTORNO PARA TESTS:
 * Para evitar el error "ERROR CONFIG: La variable de entorno es obligatoria",
 * definimos valores ficticios antes de que se dispare la cadena de imports.
 */
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test_user";
process.env.DB_USERNAME = "test_user"; // 👈 Agregado para cumplir con la validación específica
process.env.DB_PASSWORD = "test_password";
process.env.DB_NAME = "test_db";
process.env.JWT_SECRET = "test_secret";
process.env.GEMINI_API_KEY = "uyerygreu";
process.env.ENCRYPTION_KEY = "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
process.env.ENCRYPTION_SALT = "8f1a2b3c4d5e6f7a";
import { InitialRoute } from "@infra/https/routes/public/InitialRoute";

describe("InitialRoute", () => {
    let initialRoute: InitialRoute;
    let controllerMock: any;

    beforeEach(() => {
        controllerMock = {
            initial: jest.fn()
        };
        initialRoute = new InitialRoute(controllerMock);
    });

    it("should initialize the router", () => {
        expect(initialRoute.router).toBeDefined();
    });

    describe("GET /end", () => {
        it("should call controller.initial when the /end route is triggered", async () => {
            const req = {} as any;
            const res = {} as any;
            const next = jest.fn();

            // 1. Buscamos el Layer
            const routeLayer = initialRoute.router.stack.find(
                (s: any) => s.route?.path === "/end" && s.route?.methods?.get
            );

            // 2. Validaciones defensivas para Jest y TypeScript
            expect(routeLayer).toBeDefined();
            expect(routeLayer?.route).toBeDefined();
            expect(routeLayer?.route?.stack).toBeDefined();

            /**
             * 3. Extracción segura del handler.
             * Usamos encadenamiento opcional y una aserción final para el llamado.
             */
            const handler = routeLayer?.route?.stack?.[0]?.handle;

            // Verificamos que el handler sea una función antes de ejecutarlo
            expect(typeof handler).toBe("function");

            if (handler) {
                await handler(req, res, next);
            }

            // 4. Verificación del controlador
            expect(controllerMock.initial).toHaveBeenCalledWith(req, res, next);
        });
    });
});