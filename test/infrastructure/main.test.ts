// 1. Mockeamos el módulo ANTES de importar main.ts o el container real
jest.mock("@infra/di/inversifyConfig", () => ({
    container: {
        // Simulamos el método get para que devuelva lo que queramos
        get: jest.fn(),
        // Simulamos rebind para Inversify v6 (que es asíncrono)
        rebind: jest.fn().mockResolvedValue({
            toConstantValue: jest.fn()
        }),
        snapshot: jest.fn(),
        restore: jest.fn(),
        isBound: jest.fn().mockReturnValue(true)
    }
}));

// 2. Ahora importamos las dependencias
import { container } from "@infra/di/inversifyConfig";
import { TYPES } from "@app/dtos/models/types";
import { bootstrap } from "@infra/main";

describe("Main Infrastructure Entry Point (Mocked Container)", () => {
    let serverMock: any;

    beforeEach(() => {
        // Limpiamos los mocks antes de cada test
        jest.clearAllMocks();

        serverMock = {
            start: jest.fn()
        };

        // Configuramos el comportamiento del mock del contenedor
        (container.get as jest.Mock).mockReturnValue(serverMock);
    });

    it("should initialize bootstrap and call server.start()", () => {
        const server = bootstrap();

        expect(server).toBeDefined();
        // Verificamos que bootstrap pidió el TYPES.ServerExpress
        expect(container.get).toHaveBeenCalledWith(TYPES.ServerExpress);
        // Verificamos que se llamó al método start del mock devuelto
        expect(serverMock.start).toHaveBeenCalled();
    });

    it("should register global error listeners", () => {
        bootstrap();

        expect(process.listenerCount('unhandledRejection')).toBeGreaterThan(0);
        expect(process.listenerCount('uncaughtException')).toBeGreaterThan(0);
    });

    afterAll(() => {
        // Limpieza vital para evitar el error de "Child process exception"
        process.removeAllListeners('unhandledRejection');
        process.removeAllListeners('uncaughtException');
    });
});