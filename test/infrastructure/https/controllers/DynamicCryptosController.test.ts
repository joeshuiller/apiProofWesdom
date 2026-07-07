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

// 2. Mock del esquema de Zod para DynamicCryptos
jest.mock("@infra/models/CreateDynamicCryptoSchema", () => ({
    CreateDynamicCryptoSchema: {
        parse: jest.fn((data) => data)
    }
}));

import { Request, Response, NextFunction } from 'express';
import { DynamicCryptosController } from '@infra/https/controllers/DynamicCryptosController';
import { CreateDynamicCryptoSchema } from "@infra/models/CreateDynamicCryptoSchema";

describe("DynamicCryptosController", () => {
    let controller: DynamicCryptosController;

    // Mocks de dependencias
    let useCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '172.16.0.1';
    const mockConfig = {
        id: 1,
        publicKey: "rsa_pub_key_content",
        active: true,
        idProyectsClients: 10
    };
    const validDecryptedData = {
        publicKey: "rsa_pub_key_content",
        privateKey: "rsa_priv_key_content",
        idProyectsClients: 10
    };
    const fakeEncryptedPayload = "base64_payload_encrypted";

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Use Case
        useCaseMock = {
            findAllByProject: jest.fn(),
            findById: jest.fn(),
            findActiveByProject: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
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
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Instanciación manual del controlador
        controller = new DynamicCryptosController(
            useCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("getAllByProject", () => {
        it("debe retornar configuraciones cifradas y limpiar intentos", async () => {
            req = { params: { projectId: "10" }, socket: { remoteAddress: remoteIp } as any };
            useCaseMock.findAllByProject.mockResolvedValue([mockConfig]);

            await controller.getAllByProject(req as Request, res as Response, next);

            expect(useCaseMock.findAllByProject).toHaveBeenCalledWith(10);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, [mockConfig], 200);
        });

        it("debe penalizar la IP si falla el proceso", async () => {
            req = { params: { projectId: "10" }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("DB Connection Error");
            useCaseMock.findAllByProject.mockRejectedValue(error);

            await controller.getAllByProject(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("getById", () => {
        it("debe retornar una configuración específica cifrada", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            useCaseMock.findById.mockResolvedValue(mockConfig);

            await controller.getById(req as Request, res as Response, next);

            expect(useCaseMock.findById).toHaveBeenCalledWith(1);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockConfig, 200);
        });
    });

    describe("getActive", () => {
        it("debe retornar la configuración activa del proyecto", async () => {
            req = { params: { projectId: "10" }, socket: { remoteAddress: remoteIp } as any };
            useCaseMock.findActiveByProject.mockResolvedValue(mockConfig);

            await controller.getActive(req as Request, res as Response, next);

            expect(useCaseMock.findActiveByProject).toHaveBeenCalledWith(10);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockConfig, 200);
        });
    });

    describe("store (Creación)", () => {
        it("debe desencriptar, validar con Zod, crear la configuración y retornar 201 cifrado", async () => {
            req = {
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any
            };
            useCaseMock.create.mockResolvedValue(mockConfig);

            await controller.store(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(CreateDynamicCryptoSchema.parse).toHaveBeenCalledWith(validDecryptedData);
            expect(useCaseMock.create).toHaveBeenCalledWith(validDecryptedData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockConfig, 201);
        });

        it("debe penalizar la IP si falla el descifrado o la validación", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Data corruption");
            securityUtilsMock.decrypt.mockImplementation(() => { throw error; });

            await controller.store(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("update", () => {
        it("debe actualizar la configuración y retornar 204 cifrado", async () => {
            req = {
                params: { id: "1" },
                body: { active: false },
                socket: { remoteAddress: remoteIp } as any
            };
            useCaseMock.update.mockResolvedValue(mockConfig);

            await controller.update(req as Request, res as Response, next);

            expect(useCaseMock.update).toHaveBeenCalledWith(1, expect.any(Object));
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockConfig, 204);
        });
    });

    describe("destroy (Borrado)", () => {
        it("debe eliminar el registro y retornar 204 plano", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            useCaseMock.delete.mockResolvedValue(undefined);

            await controller.destroy(req as Request, res as Response, next);

            expect(useCaseMock.delete).toHaveBeenCalledWith(1);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        it("debe penalizar IP ante un fallo en el borrado", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Delete restricted");
            useCaseMock.delete.mockRejectedValue(error);

            await controller.destroy(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});