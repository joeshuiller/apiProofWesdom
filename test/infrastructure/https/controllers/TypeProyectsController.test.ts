// 1. Mock de Inversify y Decoradores
jest.mock("@infra/di/inversifyConfig", () => ({
    container: {
        get: jest.fn(),
    }
}));

/**
 * ✅ CONFIGURACIÓN GLOBAL DE ENTORNO PARA TESTS:
 * Definimos valores ficticios para satisfacer las validaciones de env.ts y SecurityUtils.
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
 * ✅ Mocks Virtuales para librerías con binarios nativos
 */
jest.mock('@xenova/transformers', () => ({
    pipeline: jest.fn(),
    RawImage: { read: jest.fn() },
    env: { backends: { onnx: { logLevel: 'error' } }, allowLocalModels: true }
}), { virtual: true });

jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }));

// 2. Mock del esquema de Zod para TypeProyects
jest.mock("@infra/models/TypeProyectRegistrationSchema", () => ({
    TypeProyectRegistrationSchema: {
        parse: jest.fn((data) => data)
    }
}));

import { Request, Response, NextFunction } from 'express';
import { TypeProyectsController } from '@infra/https/controllers/TypeProyectsController';
import { TypeProyectRegistrationSchema } from '@infra/models/TypeProyectRegistrationSchema';

describe("TypeProyectsController", () => {
    let controller: TypeProyectsController;

    // Mocks de dependencias
    let useCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '127.0.0.1';
    const mockTypeProject = { id: 1, name: "E-Commerce", active: true };
    const validDecryptedData = { name: "E-Commerce" };
    const fakeEncryptedPayload = "encrypted_type_project_payload";

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Use Case
        useCaseMock = {
            create: jest.fn(),
            findById: jest.fn()
        };

        // Mock de SecurityUtils
        securityUtilsMock = {
            decrypt: jest.fn().mockReturnValue(validDecryptedData),
            sendEncryptedResponse: jest.fn((response, data, status) => {
                return response.status(status).json({ payload: data });
            })
        };

        // Mock de BruteForce
        bruteForceUseCaseMock = {
            clearAttempts: jest.fn(),
            registerFailedAttempt: jest.fn(),
        };

        // Mock de Express
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Instanciación manual del controlador
        controller = new TypeProyectsController(
            useCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("create", () => {
        it("debe crear un tipo de proyecto exitosamente tras desencriptar, validar y limpiar intentos", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            useCaseMock.create.mockResolvedValue(mockTypeProject);

            await controller.create(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(TypeProyectRegistrationSchema.parse).toHaveBeenCalledWith(validDecryptedData);
            expect(useCaseMock.create).toHaveBeenCalledWith(validDecryptedData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, { users: mockTypeProject }, 201);
            expect(next).not.toHaveBeenCalled();
        });

        it("debe registrar un fallo en BruteForce si la creación o validación falla", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Validation Error");
            (TypeProyectRegistrationSchema.parse as jest.Mock).mockImplementationOnce(() => { throw error; });

            await controller.create(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("findAllTypeProyects", () => {
        it("debe retornar el tipo de proyecto por ID y retornar 200 cifrado", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            useCaseMock.findById.mockResolvedValue(mockTypeProject);

            await controller.findAllTypeProyects(req as Request, res as Response, next);

            expect(useCaseMock.findById).toHaveBeenCalledWith("1");
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockTypeProject, 200);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it("debe manejar errores en findAllTypeProyects delegando a next", async () => {
            req = { params: { id: "999" } };
            const error = new Error("Not Found");
            useCaseMock.findById.mockRejectedValue(error);

            await controller.findAllTypeProyects(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});