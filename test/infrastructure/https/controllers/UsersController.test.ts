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

// 2. Mocks de esquemas de Zod para Usuarios
jest.mock("@infra/models/UserRegistrationSchema", () => ({
    UserRegistrationSchema: {
        parse: jest.fn((data) => data)
    }
}));

jest.mock("@infra/models/UserLoginSchema", () => ({
    UserLoginSchema: {
        parse: jest.fn((data) => data)
    }
}));

import { Request, Response, NextFunction } from 'express';
import { UsersController } from '@infra/https/controllers/UsersController';
import { UserRegistrationSchema } from '@infra/models/UserRegistrationSchema';
import { UserLoginSchema } from '@infra/models/UserLoginSchema';

describe("UsersController", () => {
    let controller: UsersController;

    // Mocks de las 10 dependencias
    let usersUseCaseMock: any;
    let userPasswordUseCaseMock: any;
    let jwtUseCaseMock: any;
    let loggerUseCaseMock: any;
    let menuUseCaseMock: any;
    let typeProyectsUseCaseMock: any;
    let clientsProyectsUseCaseMock: any;
    let campaignsUseCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '127.0.0.1';
    const mockUser = { id: 1, email: "test@softsaenz.com", rolesId: 2, typeProyectsId: 10, password: "hashed_password" };
    const validRegistrationData = { email: "test@softsaenz.com", password: "Password123!", rolesId: 2 };
    const fakeEncryptedPayload = "encrypted_user_payload";

    beforeEach(() => {
        jest.clearAllMocks();

        usersUseCaseMock = { create: jest.fn(), findByEmail: jest.fn() };
        userPasswordUseCaseMock = { compare: jest.fn() };
        jwtUseCaseMock = { generateToken: jest.fn() };
        loggerUseCaseMock = { info: jest.fn(), error: jest.fn() };
        menuUseCaseMock = { getMenusByRoleAndProject: jest.fn() };
        typeProyectsUseCaseMock = { findById: jest.fn() };
        clientsProyectsUseCaseMock = { findById: jest.fn() };
        campaignsUseCaseMock = { getCampaignById: jest.fn() };

        securityUtilsMock = {
            decrypt: jest.fn().mockReturnValue(validRegistrationData),
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

        // Instanciación manual del controlador con todos sus argumentos
        controller = new UsersController(
            usersUseCaseMock,
            userPasswordUseCaseMock,
            jwtUseCaseMock,
            loggerUseCaseMock,
            menuUseCaseMock,
            typeProyectsUseCaseMock,
            clientsProyectsUseCaseMock,
            campaignsUseCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("create", () => {
        it("debe crear un usuario exitosamente, generar token y limpiar intentos", async () => {
            req = {
                body: { payload: fakeEncryptedPayload },
                headers: { 'x-trace-id': 'uuid-test' },
                socket: { remoteAddress: remoteIp } as any
            };

            usersUseCaseMock.create.mockResolvedValue(mockUser);
            jwtUseCaseMock.generateToken.mockReturnValue("mocked_jwt_token");

            await controller.create(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(UserRegistrationSchema.parse).toHaveBeenCalled();
            expect(usersUseCaseMock.create).toHaveBeenCalledWith(validRegistrationData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ authorisation: "mocked_jwt_token" }),
                201
            );
        });

        it("debe retornar 401 y registrar fallo si el UseCase no retorna datos", async () => {
            req = {
                body: { payload: fakeEncryptedPayload },
                headers: {},
                socket: { remoteAddress: remoteIp } as any
            };
            usersUseCaseMock.create.mockResolvedValue(null);

            await controller.create(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(loggerUseCaseMock.error).toHaveBeenCalled();
        });
    });

    describe("login", () => {
        it("debe autenticar exitosamente y limpiar intentos", async () => {
            req = {
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any,
                headers: {}
            };

            securityUtilsMock.decrypt.mockReturnValue({ email: "test@test.com", password: "123" });
            usersUseCaseMock.findByEmail.mockResolvedValue(mockUser);
            userPasswordUseCaseMock.compare.mockResolvedValue(true);
            jwtUseCaseMock.generateToken.mockReturnValue("login_token");

            await controller.login(req as Request, res as Response, next);

            expect(userPasswordUseCaseMock.compare).toHaveBeenCalled();
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, expect.any(Object), 200);
        });

        it("debe retornar 401 si el usuario no existe (sin registrar fallo en helper interno)", async () => {
            req = { body: { payload: fakeEncryptedPayload }, headers: {} };
            usersUseCaseMock.findByEmail.mockResolvedValue(null);

            await controller.login(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(bruteForceUseCaseMock.clearAttempts).not.toHaveBeenCalled();
        });

        it("debe penalizar la IP si ocurre un error inesperado (catch)", async () => {
            req = {
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any,
                headers: {}
            };
            const error = new Error("DB Connection Lost");
            usersUseCaseMock.findByEmail.mockRejectedValue(error);

            await controller.login(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("loginClients", () => {
        it("debe realizar login extendido para clientes y limpiar intentos", async () => {
            req = {
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any,
                headers: {}
            };

            usersUseCaseMock.findByEmail.mockResolvedValue(mockUser);
            userPasswordUseCaseMock.compare.mockResolvedValue(true);

            // Mocks para las llamadas adicionales de clientes
            menuUseCaseMock.getMenusByRoleAndProject.mockResolvedValue([{ title: "Home" }]);
            typeProyectsUseCaseMock.findById.mockResolvedValue({ name: "Proyecto X" });
            clientsProyectsUseCaseMock.findById.mockResolvedValue({ logo: "logo.png" });
            campaignsUseCaseMock.getCampaignById.mockResolvedValue({ active: true });

            jwtUseCaseMock.generateToken.mockReturnValue("client_token");

            await controller.loginClients(req as Request, res as Response, next);

            expect(menuUseCaseMock.getMenusByRoleAndProject).toHaveBeenCalled();
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(
                res,
                expect.objectContaining({ menu: expect.any(Array), details: expect.any(Object) }),
                200
            );
        });
    });

    describe("logoutJwt", () => {
        it("debe retornar status 500 según implementación base", async () => {
            await controller.logoutJwt({} as Request, res as Response, next);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});