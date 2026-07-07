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

// 2. Mock del esquema de Zod para Menu
jest.mock("@infra/models/MenuRegistrationSchema", () => ({
    MenuRegistrationSchema: {
        parse: jest.fn((data) => data)
    }
}));

import { Request, Response, NextFunction } from 'express';
import { MenuController } from '@infra/https/controllers/MenuController';
import { MenuRegistrationSchema } from '@infra/models/MenuRegistrationSchema';

describe("MenuController", () => {
    let controller: MenuController;

    // Mocks de dependencias
    let menuUseCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '127.0.0.1';
    const mockMenu = { id: 1, title: "Dashboard", path: "/dashboard", rolesId: 1 };
    const validDecryptedData = { title: "Dashboard", path: "/dashboard", rolesId: 1 };
    const fakeEncryptedPayload = "encrypted_menu_payload";

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Use Case
        menuUseCaseMock = {
            createMenu: jest.fn(),
            getAllMenus: jest.fn(),
            getMenuById: jest.fn(),
            updateMenu: jest.fn(),
            deleteMenu: jest.fn(),
            getMenusByRoleAndProject: jest.fn()
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
        controller = new MenuController(
            menuUseCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("createMenu", () => {
        it("debe crear un menú exitosamente tras desencriptar, validar y limpiar intentos", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            menuUseCaseMock.createMenu.mockResolvedValue(mockMenu);

            await controller.createMenu(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(MenuRegistrationSchema.parse).toHaveBeenCalledWith(validDecryptedData);
            expect(menuUseCaseMock.createMenu).toHaveBeenCalledWith(validDecryptedData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockMenu, 201);
        });

        it("debe penalizar la IP si falla la creación del menú", async () => {
            req = { body: { payload: fakeEncryptedPayload }, socket: { remoteAddress: remoteIp } as any };
            const error = new Error("Zod validation failed");
            (MenuRegistrationSchema.parse as jest.Mock).mockImplementationOnce(() => { throw error; });

            await controller.createMenu(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("getAllMenus", () => {
        it("debe retornar todos los menús y limpiar intentos", async () => {
            req = { socket: { remoteAddress: remoteIp } as any };
            menuUseCaseMock.getAllMenus.mockResolvedValue([mockMenu]);

            await controller.getAllMenus(req as Request, res as Response, next);

            expect(menuUseCaseMock.getAllMenus).toHaveBeenCalled();
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, [mockMenu], 200);
        });
    });

    describe("getMenuById", () => {
        it("debe retornar el menú si existe y limpiar intentos", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            menuUseCaseMock.getMenuById.mockResolvedValue(mockMenu);

            await controller.getMenuById(req as Request, res as Response, next);

            expect(menuUseCaseMock.getMenuById).toHaveBeenCalledWith(1);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockMenu, 200);
        });

        it("debe asignar status 404 si el menú no fue encontrado", async () => {
            req = { params: { id: "99" }, socket: { remoteAddress: remoteIp } as any };
            const error: any = new Error("El menú no fue encontrado");
            menuUseCaseMock.getMenuById.mockRejectedValue(error);

            await controller.getMenuById(req as Request, res as Response, next);

            expect(error.status).toBe(404);
            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("updateMenu", () => {
        it("debe actualizar el menú y limpiar intentos", async () => {
            const updateData = { title: "Nuevo Título" };
            req = { params: { id: "1" }, body: updateData, socket: { remoteAddress: remoteIp } as any };
            menuUseCaseMock.updateMenu.mockResolvedValue({ ...mockMenu, ...updateData });

            await controller.updateMenu(req as Request, res as Response, next);

            expect(menuUseCaseMock.updateMenu).toHaveBeenCalledWith(1, updateData);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, expect.any(Object), 200);
        });
    });

    describe("deleteMenu", () => {
        it("debe eliminar el menú y retornar éxito", async () => {
            req = { params: { id: "1" }, socket: { remoteAddress: remoteIp } as any };
            menuUseCaseMock.deleteMenu.mockResolvedValue(undefined);

            await controller.deleteMenu(req as Request, res as Response, next);

            expect(menuUseCaseMock.deleteMenu).toHaveBeenCalledWith(1);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe("getMenusByRoleAndProject", () => {
        it("debe retornar los menús filtrados si los parámetros son correctos", async () => {
            req = {
                query: { rolAppId: "2", clientsProyectsId: "10" },
                socket: { remoteAddress: remoteIp } as any
            };
            menuUseCaseMock.getMenusByRoleAndProject.mockResolvedValue([mockMenu]);

            await controller.getMenusByRoleAndProject(req as Request, res as Response, next);

            expect(menuUseCaseMock.getMenusByRoleAndProject).toHaveBeenCalledWith(2, 10);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, [mockMenu], 200);
        });

        it("debe retornar error 400 si los parámetros no son numéricos", async () => {
            req = { query: { rolAppId: "abc", clientsProyectsId: "10" } };

            await controller.getMenusByRoleAndProject(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
            expect(menuUseCaseMock.getMenusByRoleAndProject).not.toHaveBeenCalled();
        });

        it("debe penalizar la IP si falla la obtención por error de base de datos", async () => {
            req = {
                query: { rolAppId: "2", clientsProyectsId: "10" },
                socket: { remoteAddress: remoteIp } as any
            };
            const error = new Error("DB Error");
            menuUseCaseMock.getMenusByRoleAndProject.mockRejectedValue(error);

            await controller.getMenusByRoleAndProject(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});