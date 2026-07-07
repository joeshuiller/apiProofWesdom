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

// Mocks de módulos pesados o nativos
jest.mock('argon2', () => ({ hash: jest.fn(), verify: jest.fn() }));

/**
 * ✅ SOLUCIÓN AL ERROR: Cannot find module '@xenova/transformers'
 * Se agrega { virtual: true } para que Jest no intente localizar el paquete físicamente
 * en node_modules si no existe o falla su resolución.
 */
jest.mock('@xenova/transformers', () => ({
    pipeline: jest.fn(),
    RawImage: { read: jest.fn() },
    env: { backends: { onnx: { logLevel: 'error' } }, allowLocalModels: true }
}), { virtual: true });

// Mock de Inversify
jest.mock("inversify", () => ({
    injectable: () => (target: any) => target,
    inject: () => (target: any, key: string, index: number) => { },
}));

// Mock del esquema de Zod
jest.mock("@infra/models/CampaignRegistrationSchema", () => ({
    CampaignRegistrationSchema: {
        parse: jest.fn((data) => data)
    }
}));

import { Request, Response, NextFunction } from 'express';
import { CampaignsController } from '@infra/https/controllers/CampaignsController';
import { CampaignRegistrationSchema } from '@infra/models/CampaignRegistrationSchema';

describe("CampaignsController", () => {
    let controller: CampaignsController;

    // Mocks de dependencias
    let campaignsUseCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '127.0.0.1';
    const mockCampaign = { id: 1, name: "Campaña Verano 2024", active: true, typeProyectsId: 1 };
    const validData = { name: "Campaña Verano 2024", active: true, typeProyectsId: 1 };
    const fakeEncryptedPayload = "encrypted_payload_string";

    beforeEach(() => {
        jest.clearAllMocks();

        campaignsUseCaseMock = {
            createCampaign: jest.fn(),
            getCampaignById: jest.fn(),
            getCampaignsByProject: jest.fn(),
            updateCampaign: jest.fn(),
            deleteCampaign: jest.fn()
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
            checkAttemptStatus: jest.fn(),
        };

        // Mock de Express
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Instanciación manual con las 3 dependencias inyectadas
        controller = new CampaignsController(
            campaignsUseCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("create", () => {
        it("debe crear una campaña exitosamente y limpiar intentos", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            campaignsUseCaseMock.createCampaign.mockResolvedValue(mockCampaign);

            await controller.create(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(campaignsUseCaseMock.createCampaign).toHaveBeenCalledWith(validData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockCampaign, 201);
        });

        it("debe registrar un fallo en BruteForce si la validación o lógica falla", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Decryption failed");
            securityUtilsMock.decrypt.mockImplementation(() => { throw error; });

            await controller.create(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("findById", () => {
        it("debe retornar la campaña si existe y limpiar intentos", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            campaignsUseCaseMock.getCampaignById.mockResolvedValue(mockCampaign);

            await controller.findById(req as Request, res as Response, next);

            expect(campaignsUseCaseMock.getCampaignById).toHaveBeenCalledWith(1);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockCampaign, 200);
        });

        it("debe penalizar la IP si la búsqueda falla por error interno", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Database error");
            campaignsUseCaseMock.getCampaignById.mockRejectedValue(error);

            await controller.findById(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("findAllByProject", () => {
        it("debe retornar la lista de campañas y limpiar intentos", async () => {
            req = { params: { projectId: "10" }, socket: { remoteAddress: remoteIp } as any };
            const list = [mockCampaign];
            campaignsUseCaseMock.getCampaignsByProject.mockResolvedValue(list);

            await controller.findAllByProject(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, list, 200);
        });

        it("debe retornar 404 si no hay campañas pero no penaliza IP (no es error técnico)", async () => {
            req = { params: { projectId: "10" }, socket: { remoteAddress: remoteIp } as any };
            campaignsUseCaseMock.getCampaignsByProject.mockResolvedValue([]);

            await controller.findAllByProject(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(bruteForceUseCaseMock.registerFailedAttempt).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("debe actualizar correctamente y limpiar intentos", async () => {
            req = { params: { id: "1" }, body: validData, socket: { remoteAddress: remoteIp } as any };
            campaignsUseCaseMock.updateCampaign.mockResolvedValue(mockCampaign);

            await controller.update(req as Request, res as Response, next);

            expect(campaignsUseCaseMock.updateCampaign).toHaveBeenCalledWith(1, validData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockCampaign, 200);
        });

        it("debe penalizar IP si ocurre un error en la actualización", async () => {
            req = { params: { id: "1" }, body: validData, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Update failure");
            campaignsUseCaseMock.updateCampaign.mockRejectedValue(error);

            await controller.update(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("delete", () => {
        it("debe retornar éxito y limpiar intentos al eliminar", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            campaignsUseCaseMock.deleteCampaign.mockResolvedValue(true);

            await controller.delete(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it("debe penalizar la IP si falla la eliminación por error técnico", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Delete restricted");
            campaignsUseCaseMock.deleteCampaign.mockRejectedValue(error);

            await controller.delete(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});