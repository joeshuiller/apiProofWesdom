import "reflect-metadata";

/**
 * ✅ 1. CONFIGURACIÓN GLOBAL DE ENTORNO (CRÍTICO)
 * Se definen antes de cualquier import para evitar que 'env.ts' lance excepciones.
 */
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test_user";
process.env.DB_USERNAME = "test_user";
process.env.DB_PASSWORD = "test_password";
process.env.DB_NAME = "test_db";
process.env.ENCRYPTION_KEY = "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
process.env.ENCRYPTION_SALT = "8f1a2b3c4d5e6f7a";
process.env.PORT = "3000";
process.env.NODE_ENV = "test";
process.env.GEMINI_API_KEY = "uyerygreu";
process.env.JWT_SECRET = "test_secret";

jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }));
jest.mock('strong-error-handler', () => jest.fn(() => (req: any, res: any, next: any) => next()));
jest.mock('cors', () => jest.fn(() => (req: any, res: any, next: any) => next()));

/**
 * ✅ 3. MOCK DE INVERSIFY (Constructor Fix)
 * Usamos 'function' para asegurar que 'new ContainerModule' sea válido en Jest.
 */
const mockBind = jest.fn().mockReturnThis();
const mockTo = jest.fn().mockReturnThis();
const mockInSingletonScope = jest.fn().mockReturnThis();

jest.mock("inversify", () => {
    return {
        injectable: () => (target: any) => target,
        inject: () => (target: any, key: string, index: number) => { },
        Container: jest.fn().mockImplementation(function (this: any) {
            this.load = jest.fn();
            this.bind = mockBind;
        }),
        ContainerModule: jest.fn().mockImplementation(function (this: any, registry: any) {
            this.registry = registry; // Almacenamos el callback para ejecutarlo en el test
        }),
    };
});

// Mock de módulos que podrían causar efectos secundarios al importar
jest.mock("@infra/config/SocketServer", () => ({ SocketAdapter: class { } }));
jest.mock("@infra/config/ExpressServer", () => ({ ServerExpress: class { } }));

// 4. IMPORTS (Después de los mocks)
import { TYPES } from "@app/dtos/models/types";
import {
    repositoriesModule,
    servicesModule,
    useCasesModule,
    controllersModule,
    routesModule,
    serverModule,
    utilsModule,
    container
} from "@infra/di/inversifyConfig";

describe("Inversify Configuration (Full Coverage)", () => {

    beforeEach(() => {
        /**
         * ✅ CORRECCIÓN CRÍTICA:
         * No usamos jest.clearAllMocks() porque borraría la llamada container.load() 
         * que ocurre al momento de importar inversifyConfig.ts. 
         * Limpiamos solo los mocks que se reutilizan en las validaciones de registros.
         */
        mockBind.mockClear();
        mockTo.mockClear();
        mockInSingletonScope.mockClear();

        // Configuración del encadenamiento: bind().to().inSingletonScope()
        mockBind.mockReturnValue({
            to: mockTo.mockReturnValue({
                inSingletonScope: mockInSingletonScope
            })
        });
    });

    /**
     * Helper para ejecutar la lógica interna de los ContainerModule definidos en el código
     */
    const runModuleRegistry = (module: any) => {
        if (module && (module as any).registry) {
            (module as any).registry({ bind: mockBind });
        }
    };

    it("1. Repositories Module: debe vincular repositorios como Singletons", () => {
        runModuleRegistry(repositoriesModule);

        expect(mockBind).toHaveBeenCalledWith(TYPES.IUserRepository);
        expect(mockInSingletonScope).toHaveBeenCalled();
    });

    it("2. Services Module: debe vincular servicios base como Singletons", () => {
        runModuleRegistry(servicesModule);

        expect(mockBind).toHaveBeenCalledWith(TYPES.ILoggerRepository);
        expect(mockBind).toHaveBeenCalledWith(TYPES.IPasswordHasher);
        expect(mockBind).toHaveBeenCalledWith(TYPES.IAuthService);
        expect(mockInSingletonScope).toHaveBeenCalled();
    });

    it("3. UseCases Module: debe vincular todos los casos de uso", () => {
        runModuleRegistry(useCasesModule);

        expect(mockBind).toHaveBeenCalledWith(TYPES.UsersUseCase);
    });

    it("4. Controllers Module: debe vincular todos los controladores", () => {
        runModuleRegistry(controllersModule);

        expect(mockBind).toHaveBeenCalledWith(TYPES.UsersController);
    });

    it("5. Routes Module: debe vincular el orquestador y las rutas individuales", () => {
        runModuleRegistry(routesModule);

        expect(mockBind).toHaveBeenCalledWith(TYPES.Routes);
        expect(mockBind).toHaveBeenCalledWith(TYPES.UsersRoutes);
        expect(mockInSingletonScope).toHaveBeenCalled();
    });

    it("6. Server Module: debe vincular Express y Socket como Singletons", () => {
        runModuleRegistry(serverModule);

        expect(mockBind).toHaveBeenCalledWith(TYPES.ServerExpress);
        expect(mockInSingletonScope).toHaveBeenCalled();
    });

    it("7. Utils Module: debe vincular utilidades de seguridad y datos", () => {
        runModuleRegistry(utilsModule);

        expect(mockBind).toHaveBeenCalledWith(TYPES.UtilsData);
        expect(mockBind).toHaveBeenCalledWith(TYPES.SecurityUtils);
        expect(mockInSingletonScope).toHaveBeenCalled();
    });

    it("8. Container: debe haberse inicializado y cargado los módulos", () => {
        // Verificamos que el contenedor exportado sea una instancia del mock
        expect(container).toBeDefined();
        // Al quitar clearAllMocks() del beforeEach, esta expectativa ahora será válida
        expect(container.load).toHaveBeenCalled();
    });
});