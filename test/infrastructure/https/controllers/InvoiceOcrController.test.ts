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

import { Request, Response, NextFunction } from 'express';
import { InvoiceOcrController } from '@infra/https/controllers/InvoiceOcrController';

describe("InvoiceOcrController", () => {
    let controller: InvoiceOcrController;

    // Mocks de dependencias
    let invoiceUseCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '192.168.1.50';
    const fakeBase64 = "data:image/png;base64,SGVsbG8=";
    const fakeEncryptedPayload = "encrypted_payload_string";
    const mockOcrResult = {
        documentNumber: "12345678",
        names: "JOHN DOE",
        confidence: 0.95
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Use Case (ProcessIdentityOcrUseCase)
        invoiceUseCaseMock = {
            processInvoiceOcr: jest.fn(),
            processIdentityOcr: jest.fn()
        };

        // Mock de SecurityUtils
        securityUtilsMock = {
            decrypt: jest.fn(),
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
        controller = new InvoiceOcrController(
            invoiceUseCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("processInvoice", () => {
        it("debe procesar una factura correctamente tras desencriptar y limpiar intentos", async () => {
            const decryptedBody = { image: fakeBase64 };
            req = {
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any
            };

            securityUtilsMock.decrypt.mockReturnValue(decryptedBody);
            invoiceUseCaseMock.processInvoiceOcr.mockResolvedValue(mockOcrResult);

            await controller.processInvoice(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(invoiceUseCaseMock.processInvoiceOcr).toHaveBeenCalledWith(fakeBase64);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockOcrResult, 200);
            expect(next).not.toHaveBeenCalled();
        });

        it("debe registrar un fallo en BruteForce si el proceso de factura falla", async () => {
            req = {
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any
            };
            const error = new Error("OCR Engine Timeout");
            securityUtilsMock.decrypt.mockReturnValue({ image: fakeBase64 });
            invoiceUseCaseMock.processInvoiceOcr.mockRejectedValue(error);

            await controller.processInvoice(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("processIdentity", () => {
        it("debe procesar un documento de identidad, limpiar intentos y retornar 200", async () => {
            const decryptedBody = { image: fakeBase64 };
            req = {
                body: { payload: fakeEncryptedPayload },
                socket: { remoteAddress: remoteIp } as any
            };

            securityUtilsMock.decrypt.mockReturnValue(decryptedBody);
            invoiceUseCaseMock.processIdentityOcr.mockResolvedValue(mockOcrResult);

            await controller.processIdentity(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(invoiceUseCaseMock.processIdentityOcr).toHaveBeenCalledWith(fakeBase64);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockOcrResult, 200);
        });

        it("debe penalizar la IP si falla el descifrado del payload", async () => {
            req = {
                body: { payload: "bad_data" },
                socket: { remoteAddress: remoteIp } as any
            };
            const error = new Error("Decryption failed");
            securityUtilsMock.decrypt.mockImplementation(() => { throw error; });

            await controller.processIdentity(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });
});