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

// 2. Mock del esquema de Zod para Roles
jest.mock("@infra/models/RolRegistrationSchema", () => ({
    RolRegistrationSchema: {
        parse: jest.fn((data) => data)
    }
}));

import { Request, Response, NextFunction } from 'express';
import { RolesController } from '@infra/https/controllers/RolesController';
import { RolRegistrationSchema } from '@infra/models/RolRegistrationSchema';

describe("RolesController", () => {
    let controller: RolesController;

    // Mocks de dependencias
    let rolesUseCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '127.0.0.1';
    const mockRole = { id: 1, name: "ADMIN", active: true };
    const validDecryptedData = { name: "ADMIN" };
    const fakeEncryptedPayload = "encrypted_roles_payload";

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Use Case
        rolesUseCaseMock = {
            create: jest.fn(),
            findByAll: jest.fn(),
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
        controller = new RolesController(
            rolesUseCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("create", () => {
        it("debe crear un rol exitosamente tras desencriptar, validar y limpiar intentos", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            rolesUseCaseMock.create.mockResolvedValue(mockRole);

            await controller.create(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(RolRegistrationSchema.parse).toHaveBeenCalledWith(validDecryptedData);
            expect(rolesUseCaseMock.create).toHaveBeenCalledWith(validDecryptedData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockRole, 201);
            expect(next).not.toHaveBeenCalled();
        });

        it("debe registrar un fallo en BruteForce si la creación o validación falla", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Validation Error");
            (RolRegistrationSchema.parse as jest.Mock).mockImplementationOnce(() => { throw error; });

            await controller.create(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("findAllRoles", () => {
        it("debe retornar todos los roles y limpiar intentos", async () => {
            req = { socket: { remoteAddress: remoteIp } as any };
            const rolesList = [mockRole];
            rolesUseCaseMock.findByAll.mockResolvedValue(rolesList);

            await controller.findAllRoles(req as Request, res as Response, next);

            expect(rolesUseCaseMock.findByAll).toHaveBeenCalled();
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, rolesList, 200);
        });

        it("debe penalizar la IP si falla la obtención de roles", async () => {
            req = { socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Fetch Roles Error");
            rolesUseCaseMock.findByAll.mockRejectedValue(error);

            await controller.findAllRoles(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("findByIdRoles", () => {
        it("debe retornar el rol solicitado por ID y limpiar intentos", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            rolesUseCaseMock.findById.mockResolvedValue(mockRole);

            await controller.findByIdRoles(req as Request, res as Response, next);

            expect(rolesUseCaseMock.findById).toHaveBeenCalledWith("1");
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockRole, 200);
        });

        it("debe penalizar la IP si ocurre un error buscando el ID", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("ID Not Found");
            rolesUseCaseMock.findById.mockRejectedValue(error);

            await controller.findByIdRoles(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});