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

// 2. Mock del esquema de Zod para GenerativeAI
jest.mock("@infra/models/DataAiGenimiRequestSchema", () => ({
    DataAiGenimiRequestSchema: {
        parse: jest.fn((data) => data)
    }
}));

import { Request, Response, NextFunction } from 'express';
import { GenerativeAIController } from '@infra/https/controllers/GenerativeAIController';
import { DataAiGenimiRequestSchema } from "@infra/models/DataAiGenimiRequestSchema";

describe("GenerativeAIController", () => {
    let controller: GenerativeAIController;

    // Mocks de dependencias
    let aiUseCaseMock: any;
    let securityUtilsMock: any;
    let bruteForceUseCaseMock: any;

    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    const remoteIp = '192.168.0.100';
    const fakeBase64 = "data:image/png;base64,SGVsbG8=";
    const fakeEncryptedPayload = "encrypted_payload_string";
    const mockCompareResult = { similarityScore: 95, isSameObject: true };
    const mockOcrResult = { businessName: "Comercio Test", total: 150.50 };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Use Case
        aiUseCaseMock = {
            compareBase64Images: jest.fn(),
            performOCRInvoiceIdentity: jest.fn(),
            generateContent: jest.fn()
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
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        next = jest.fn();

        // Instanciación manual del controlador
        controller = new GenerativeAIController(
            aiUseCaseMock,
            securityUtilsMock,
            bruteForceUseCaseMock
        );
    });

    describe("compareBase64", () => {
        it("debe comparar imágenes exitosamente, limpiar intentos y retornar 200", async () => {
            req = {
                body: { image1: fakeBase64, image2: fakeBase64 },
                socket: { remoteAddress: remoteIp } as any
            };
            aiUseCaseMock.compareBase64Images.mockResolvedValue(mockCompareResult);

            await controller.compareBase64(req as Request, res as Response, next);

            expect(aiUseCaseMock.compareBase64Images).toHaveBeenCalledWith(fakeBase64, fakeBase64);
            expect(bruteForceUseCaseMock.clearAttempts).toHaveBeenCalledWith(remoteIp);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockCompareResult, 200);
        });

        it("debe retornar 400 si faltan imágenes en el body", async () => {
            req = { body: { image1: fakeBase64 } };

            await controller.compareBase64(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(aiUseCaseMock.compareBase64Images).not.toHaveBeenCalled();
        });

        it("debe penalizar la IP si falla el proceso de comparación", async () => {
            req = {
                body: { image1: fakeBase64, image2: fakeBase64 },
                socket: { remoteAddress: remoteIp } as any
            };
            const error = new Error("AI Comparison Error");
            aiUseCaseMock.compareBase64Images.mockRejectedValue(error);

            await controller.compareBase64(req as Request, res as Response, next);

            expect(bruteForceUseCaseMock.registerFailedAttempt).toHaveBeenCalledWith(remoteIp);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("analyzeReceipt", () => {
        it("debe desencriptar, validar con Zod y procesar el OCR exitosamente", async () => {
            const decryptedData = { identification: "123", imageInvoice: fakeBase64 };
            req = { body: { payload: fakeEncryptedPayload } };

            securityUtilsMock.decrypt.mockReturnValue(decryptedData);
            aiUseCaseMock.performOCRInvoiceIdentity.mockResolvedValue(mockOcrResult);

            await controller.analyzeReceipt(req as Request, res as Response, next);

            expect(securityUtilsMock.decrypt).toHaveBeenCalledWith(fakeEncryptedPayload);
            expect(DataAiGenimiRequestSchema.parse).toHaveBeenCalledWith(decryptedData);
            expect(aiUseCaseMock.performOCRInvoiceIdentity).toHaveBeenCalledWith(decryptedData);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockOcrResult, 200);
        });

        it("debe delegar el error al middleware si falla el proceso de OCR", async () => {
            req = { body: { payload: fakeEncryptedPayload } };
            const error = new Error("Decryption failed");
            securityUtilsMock.decrypt.mockImplementation(() => { throw error; });

            await controller.analyzeReceipt(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("generateContent", () => {
        it("debe generar contenido DDD exitosamente y retornar 200 cifrado", async () => {
            const textInput = "Analizar este dominio de pagos";
            req = { body: { text: textInput } };
            const mockAnalysis = "DDD Analysis Result";
            aiUseCaseMock.generateContent.mockResolvedValue(mockAnalysis);

            await controller.generateContent(req as Request, res as Response, next);

            expect(aiUseCaseMock.generateContent).toHaveBeenCalledWith(textInput);
            expect(securityUtilsMock.sendEncryptedResponse).toHaveBeenCalledWith(res, mockAnalysis, 200);
        });

        it("debe manejar errores en la generación de contenido", async () => {
            req = { body: { text: "abc" } };
            const error = new Error("Text too short");
            aiUseCaseMock.generateContent.mockRejectedValue(error);

            await controller.generateContent(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});