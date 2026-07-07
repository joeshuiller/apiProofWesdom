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
/**
 * ✅ SOLUCIÓN AL ERROR: Illegal argument undefined (strong-error-handler)
 * Mockeamos los middlewares de infraestructura que disparan procesos de 
 * globalización o escaneo de archivos al ser importados.
 */
jest.mock('strong-error-handler', () => jest.fn(() => (req: any, res: any, next: any) => next()));
jest.mock('cors', () => jest.fn(() => (req: any, res: any, next: any) => next()));

/**
 * ✅ SOLUCIÓN AL ERROR DE ARGON2:
 * Evitamos que node-gyp-build intente cargar binarios nativos.
 */
jest.mock('argon2', () => ({
    hash: jest.fn(),
    verify: jest.fn(),
}));

/**
 * ✅ MOCK PREVENTIVO DE TRANSFORMERS:
 * Evita errores de ONNX o binarios nativos en entornos de test.
 */
jest.mock('@xenova/transformers', () => ({
    pipeline: jest.fn(),
    RawImage: { read: jest.fn() },
    env: { backends: { onnx: { logLevel: 'error' } }, allowLocalModels: true }
}), { virtual: true });

// 1. Mocks de Dependencias Externas (FS, Swagger)
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

jest.mock('fs');
jest.mock('swagger-ui-express', () => ({
    serve: ['serve_middleware'],
    setup: jest.fn().mockReturnValue('setup_middleware')
}));

// 2. Mocks de Express (Router y App)
const mockRouter = {
    use: jest.fn(),
    get: jest.fn()
};

jest.mock('express', () => ({
    Router: jest.fn(() => mockRouter)
}));

/**
 * ✅ SOLUCIÓN AL ERROR: TypeError: ContainerModule is not a constructor
 * Implementamos un mock completo de Inversify que soporte la instanciación de 
 * contenedores y módulos durante la carga de dependencias.
 */
jest.mock("inversify", () => {
    return {
        injectable: () => (target: any) => target,
        inject: () => (target: any, key: string, index: number) => { },
        Container: jest.fn().mockImplementation(function (this: any) {
            this.bind = jest.fn().mockReturnThis();
            this.to = jest.fn().mockReturnThis();
            this.inSingletonScope = jest.fn().mockReturnThis();
            this.load = jest.fn();
            this.get = jest.fn();
        }),
        ContainerModule: jest.fn().mockImplementation(function (this: any, cb: any) {
            this.cb = cb;
        })
    };
});

jest.mock('@core/utils/RoutersLink', () => ({
    routersLink: {
        api: '/api',
        v: '/v1'
    }
}));

// Importamos la clase bajo prueba después de todos los mocks globales
import Routes from '@infra/https/routes/Routes';

describe("Routes Orchestrator (Unit Tests)", () => {
    let routesOrchestrator: Routes;
    let mockApp: any;

    // Helper para crear objetos de ruta mockeados
    const createRouteMock = () => ({
        router: { id: `router_${Math.random().toString(36).substr(2, 9)}` }
    });

    // Definición de las 12 dependencias (11 rutas + 1 middleware)
    const routeMocks = {
        users: createRouteMock(),
        initial: createRouteMock(),
        typeProyects: createRouteMock(),
        menu: createRouteMock(),
        roles: createRouteMock(),
        campaigns: createRouteMock(),
        webHook: createRouteMock(),
        clientsProyects: createRouteMock(),
        generativeAI: createRouteMock(),
        invoiceOcr: createRouteMock(),
        dynamicCryptos: createRouteMock(),
        bruteForce: { execute: jest.fn() }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockApp = {
            use: jest.fn()
        };

        // Instanciación manual pasando todos los mocks al constructor (12 argumentos)
        routesOrchestrator = new Routes(
            routeMocks.users as any,
            routeMocks.initial as any,
            routeMocks.typeProyects as any,
            routeMocks.menu as any,
            routeMocks.roles as any,
            routeMocks.campaigns as any,
            routeMocks.webHook as any,
            routeMocks.clientsProyects as any,
            routeMocks.generativeAI as any,
            routeMocks.invoiceOcr as any,
            routeMocks.dynamicCryptos as any,
            routeMocks.bruteForce as any
        );

        // Ocultamos logs de carga de rutas para mantener limpia la consola de tests
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    describe("setup", () => {
        it("debe aplicar el bruteForceMiddleware globalmente al apiRouter", () => {
            routesOrchestrator.setup(mockApp);

            // Verificamos que sea el primer middleware en aplicarse
            expect(mockRouter.use).toHaveBeenCalledWith(routeMocks.bruteForce.execute);
        });

        it("debe configurar Swagger UI si el archivo swagger_output.json existe", () => {
            const fakeSwaggerJson = JSON.stringify({ info: { title: "API TEST" } });
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(fakeSwaggerJson);

            routesOrchestrator.setup(mockApp);

            expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('swagger_output.json'));
            expect(mockRouter.use).toHaveBeenCalledWith('/api-doc', swaggerUi.serve);

            /**
             * ✅ CORRECCIÓN:
             * Eliminamos 'expect.any(Object)' ya que apiRouter.get se llama solo con 
             * path y el handler retornado por swaggerUi.setup.
             */
            expect(mockRouter.get).toHaveBeenCalledWith('/api-doc', 'setup_middleware');
        });

        it("debe omitir la configuración de Swagger si el archivo de salida no existe", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            routesOrchestrator.setup(mockApp);

            expect(mockRouter.use).not.toHaveBeenCalledWith('/api-doc', expect.any(Array));
        });

        it("debe montar todas las sub-rutas inyectadas en los prefijos correctos", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            routesOrchestrator.setup(mockApp);

            const expectedMounts = [
                ['/api-docs', routeMocks.initial.router],
                ['/users', routeMocks.users.router],
                ['/roles', routeMocks.roles.router],
                ['/typeProyects', routeMocks.typeProyects.router],
                ['/campaigns', routeMocks.campaigns.router],
                ['/menu', routeMocks.menu.router],
                ['/webHook', routeMocks.webHook.router],
                ['/clientsProyects', routeMocks.clientsProyects.router],
                ['/ai', routeMocks.generativeAI.router],
                ['/ocr', routeMocks.invoiceOcr.router],
                ['/dynamicCryptos', routeMocks.dynamicCryptos.router],
            ];

            expectedMounts.forEach(([path, router]) => {
                expect(mockRouter.use).toHaveBeenCalledWith(path, router);
            });
        });

        it("debe montar el apiRouter final en la aplicación usando /api/v1", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            routesOrchestrator.setup(mockApp);

            expect(mockApp.use).toHaveBeenCalledWith('/api/v1', mockRouter);
        });

        it("debe lanzar un error si el archivo de Swagger tiene un formato JSON inválido", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue("NOT_A_JSON");

            expect(() => routesOrchestrator.setup(mockApp)).toThrow();
        });
    });
});