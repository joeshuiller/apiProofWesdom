import "reflect-metadata";

/**
 * ✅ CONFIGURACIÓN GLOBAL DE ENTORNO PARA TESTS:
 * Evita errores de validación de configuración en src/infrastructure/config/env.ts
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

/**
 * ✅ MOCK DE INFRAESTRUCTURA:
 * Evitamos la carga de dependencias pesadas o binarios nativos.
 */
jest.mock("@infra/di/inversifyConfig", () => ({
    container: { get: jest.fn() }
}));

jest.mock('argon2', () => ({
    hash: jest.fn(),
    verify: jest.fn(),
}));

/**
 * ✅ MOCK DE CONFIGURACIÓN MUTABLE:
 * Creamos una referencia para poder alterar los valores durante los tests.
 */
const mockConfigEnv = {
    ENCRYPTION_KEY: "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    ENCRYPTION_SALT: "8f1a2b3c4d5e6f7a"
};

jest.mock("@infra/config/env", () => ({
    configEnv: mockConfigEnv
}));

/**
 * ✅ MOCK DE INVERSIFY:
 * Implementación robusta para asegurar que actúen como constructores válidos.
 */
jest.mock("inversify", () => {
    return {
        injectable: () => (target: any) => target,
        inject: () => (target: any, key: string, index: number) => { },
        Container: jest.fn().mockImplementation(function (this: any) {
            this.bind = jest.fn().mockReturnThis();
            this.to = jest.fn().mockReturnThis();
            this.inSingletonScope = jest.fn().mockReturnThis();
            this.load = jest.fn();
            this.get = jest.fn();
        }),
        ContainerModule: jest.fn().mockImplementation(function (this: any, cb: any) {
            this.cb = cb;
        })
    };
});

import { SecurityUtils } from "@core/utils/SecurityUtils";
import { configEnv } from "@infra/config/env";
import { Response } from "express";

describe("SecurityUtils (Unit Tests)", () => {
    let securityUtils: SecurityUtils;

    beforeEach(() => {
        jest.clearAllMocks();
        // Silenciamos logs de consola para mantener limpia la salida de los tests
        jest.spyOn(console, 'log').mockImplementation(() => { });

        // Restauramos valores por defecto antes de cada test para asegurar limpieza
        process.env.ENCRYPTION_KEY = "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
        process.env.ENCRYPTION_SALT = "8f1a2b3c4d5e6f7a";
        mockConfigEnv.ENCRYPTION_KEY = "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
        mockConfigEnv.ENCRYPTION_SALT = "8f1a2b3c4d5e6f7a";
    });

    describe("Metodo: encrypt", () => {
        beforeEach(() => {
            securityUtils = new SecurityUtils();
        });

        it("debe cifrar un objeto JSON y retornar un string en Base64", () => {
            const data = { role: "ADMIN", id: 123 };
            const encrypted = securityUtils.encrypt(data);

            expect(typeof encrypted).toBe("string");
            expect(encrypted).not.toBe(JSON.stringify(data));
        });

        it("debe cifrar un string plano correctamente", () => {
            const secret = "password123";
            const encrypted = securityUtils.encrypt(secret);
            const decrypted = securityUtils.decrypt(encrypted);

            expect(decrypted).toBe(secret);
        });

        it("debe fallar si ocurre un error inesperado en la libreria crypto", () => {
            const crypto = require('crypto');
            const spy = jest.spyOn(crypto, 'createCipheriv').mockImplementation(() => {
                throw new Error("Cipher failure");
            });

            expect(() => securityUtils.encrypt("test")).toThrow("[SecurityUtils] Encryption failed");
            spy.mockRestore();
        });
    });

    describe("Metodo: decrypt", () => {
        beforeEach(() => {
            securityUtils = new SecurityUtils();
        });

        it("debe descifrar un paquete Base64 y retornar el objeto original", () => {
            const data = { token: "abc-123" };
            const encrypted = securityUtils.encrypt(data);
            const decrypted = securityUtils.decrypt(encrypted);

            expect(decrypted).toEqual(data);
        });

        it("debe retornar el string original si el contenido no es un JSON", () => {
            const text = "Hola Mundo";
            const encrypted = securityUtils.encrypt(text);
            const decrypted = securityUtils.decrypt(encrypted);

            expect(decrypted).toBe(text);
        });

        it("debe lanzar error de integridad si el contenido cifrado es alterado (Auth Tag check)", () => {
            const encrypted = securityUtils.encrypt("datos_sensibles");
            const buffer = Buffer.from(encrypted, 'base64');

            // Alteramos el último byte (donde suele estar parte del Tag de GCM)
            buffer[buffer.length - 1] = buffer[buffer.length - 1] ^ 0xFF;
            const corruptedBase64 = buffer.toString('base64');

            expect(() => securityUtils.decrypt(corruptedBase64)).toThrow(/Decryption failed or data tampered/);
        });

        it("debe lanzar error ante una cadena Base64 mal formada o muy corta", () => {
            expect(() => securityUtils.decrypt("xyz")).toThrow();
        });
    });

    describe("Helper: sendEncryptedResponse", () => {
        beforeEach(() => {
            securityUtils = new SecurityUtils();
        });

        it("debe llamar a status() y json() de Express con el formato estandarizado", () => {
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            } as unknown as Response;

            const payload = { success: true };
            const statusCode = 200;

            securityUtils.sendEncryptedResponse(mockRes, payload, statusCode);

            expect(mockRes.status).toHaveBeenCalledWith(statusCode);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                payload: expect.any(String),
                encrypted: true,
                timestamp: expect.any(String)
            }));
        });
    });
});