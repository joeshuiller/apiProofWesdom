// 1. Mock de Inversify y Decoradores
jest.mock("@infra/di/inversifyConfig", () => ({
    container: {
        get: jest.fn(),
    }
}));

/**
 * ✅ CONFIGURACIÓN GLOBAL DE ENTORNO PARA TESTS:
 * Definimos valores ficticios para evitar errores de validación de esquemas de configuración.
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

jest.mock("inversify", () => ({
    injectable: () => (target: any) => target,
    inject: () => (target: any, key: string, index: number) => { },
}));

/**
 * ✅ Mocks Virtuales para librerías con binarios nativos o pesados
 */
jest.mock('@xenova/transformers', () => ({
    pipeline: jest.fn(),
    RawImage: { read: jest.fn() },
    env: { backends: { onnx: { logLevel: 'error' } }, allowLocalModels: true }
}), { virtual: true });

jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }));

// 2. Mock del esquema de Zod
jest.mock("@infra/models/ClientsProyectsSchema", () => ({
    ClientsProyectsRequestSchema: {
        parse: jest.fn((data) => data)
    }
}));

import { Request, Response, NextFunction } from 'express';
import { ClientsProyectsController } from '@infra/https/controllers/ClientsProyectsController';
import { ClientsProyectsRequestSchema } from "@infra/models/ClientsProyectsSchema";

describe("ClientsProyectsController", () => {
    let controller: ClientsProyectsController;

    // Mocks de dependencias
    let useCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '192.168.1.1';
    const mockProject = {
        id: 1,
        title: "Proyecto Alpha",
        description: "Descripción del proyecto",
        active: true
    };
    const validData = {
        title: "Proyecto Alpha",
        description: "Descripción del proyecto",
        active: true
    };
    const fakeEncryptedPayload = "encrypted_string_base64";

    beforeEach(() => {
        jest.clearAllMocks();

        useCaseMock = {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };

        securityUtilsMock = {
            decrypt: jest.fn().mockReturnValue(validData),
            sendEncryptedResponse: jest.fn((response, data, status) => {
                return response.status(status).json({ payload: data });
            })
        };

        bruteForceUseCaseMock = {
            clearAttempts: jest.fn(),
            registerFailedAttempt: jest.fn(),
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Instanciación manual pasando los mocks al constructor
        controller = new ClientsProyectsController(
            useCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("create", () => {
        it("debe crear un proyecto exitosamente, limpiar intentos y retornar 201", async () => {
            req = {
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any
            };
            useCaseMock.create.mockResolvedValue(mockProject);

            await controller.create(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(ClientsProyectsRequestSchema.parse).toHaveBeenCalledWith(validData);
            expect(useCaseMock.create).toHaveBeenCalledWith(validData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockProject, 201);
        });

        it("debe penalizar la IP si ocurre un error en el flujo de creación", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Zod Validation Error");
            (ClientsProyectsRequestSchema.parse as jest.Mock).mockImplementationOnce(() => { throw error; });

            await controller.create(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("findAll", () => {
        it("debe retornar todos los proyectos y limpiar intentos", async () => {
            const list = [mockProject];
            req = { socket: { remoteAddress: remoteIp } as any };
            useCaseMock.findAll.mockResolvedValue(list);

            await controller.findAll(req as Request, res as Response, next);

            expect(useCaseMock.findAll).toHaveBeenCalled();
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, list, 200);
        });

        it("debe penalizar la IP si falla la obtención de la lista", async () => {
            req = { socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Fetch failed");
            useCaseMock.findAll.mockRejectedValue(error);

            await controller.findAll(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("findById", () => {
        it("debe retornar el proyecto si existe", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            useCaseMock.findById.mockResolvedValue(mockProject);

            await controller.findById(req as Request, res as Response, next);

            expect(useCaseMock.findById).toHaveBeenCalledWith(1);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockProject, 200);
        });

        it("debe retornar 404 si el proyecto no existe", async () => {
            req = { params: { id: "99" } };
            useCaseMock.findById.mockResolvedValue(null);

            await controller.findById(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    describe("update", () => {
        it("debe actualizar correctamente y limpiar intentos", async () => {
            req = {
                params: { id: "1" },
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any
            };
            useCaseMock.update.mockResolvedValue(mockProject);

            await controller.update(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockProject, 200);
        });

        it("debe registrar fallo si falla el proceso de actualización", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("DB Update Error");
            useCaseMock.update.mockRejectedValue(error);

            await controller.update(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("delete", () => {
        it("debe retornar éxito al eliminar correctamente", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            useCaseMock.delete.mockResolvedValue(true);

            await controller.delete(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Eliminado correctamente" }));
        });

        it("debe penalizar la IP ante un error interno en la eliminación", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Constraint violation");
            useCaseMock.delete.mockRejectedValue(error);

            await controller.delete(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});