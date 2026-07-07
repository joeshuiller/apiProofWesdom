import * as crypto from "crypto";
import { injectable } from "inversify";
import { Response } from "express";
import { configEnv } from "@infra/config/env";
/**
 * Interface para la configuración de cifrado
 */
export interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    tagLength: number;
}

/**
 * SecurityUtils (Senior Implementation)
 * Implementa cifrado simétrico AES-256-GCM (Galois/Counter Mode).
 * Este estándar es el equivalente moderno y seguro a openssl_encrypt.
 */
@injectable()
export class SecurityUtils {
    private readonly CONFIG: EncryptionConfig = {
        algorithm: "aes-256-gcm",
        keyLength: 32, // 256 bits
        ivLength: 12,  // Recomendado para GCM
        tagLength: 16  // Auth tag estándar
    };

    private readonly masterKey: Buffer;

    constructor() {
        /**
         * SENIOR SECURITY NOTE:
         * Never use hardcoded fallbacks for encryption keys or salts in production.
         * The salt must be consistent to derive the same key across application restarts,
         * but it must be stored securely in environment variables.
         */
        const secret = configEnv.ENCRYPTION_KEY;
        const salt = configEnv.ENCRYPTION_SALT;
        //const masterKey = crypto.scryptSync(configEnv.ENCRYPTION_KEY, configEnv.ENCRYPTION_SALT, 32);
        //console.log("LLAVE_PARA_ANGULAR:", masterKey.toString('hex'));
        //console.log("SECRET:", secret);
        //console.log("SALT:", salt);


        // Derivamos una llave de 32 bytes usando scrypt. 
        // Scrypt es resistente a ataques de fuerza bruta por hardware (ASIC).
        this.masterKey = crypto.scryptSync(secret, salt, this.CONFIG.keyLength);
    }

    /**
     * Cifra un objeto o string.
     * Retorna un string en formato Base64 que contiene: IV + AuthTag + CipherText.
     * @param data Datos a cifrar
     */
    public encrypt(data: any): string {
        try {
            const masterKey = crypto.scryptSync(configEnv.ENCRYPTION_KEY, configEnv.ENCRYPTION_SALT, 32);
            const plainText = typeof data === "string" ? data : JSON.stringify(data);

            // 1. Generar Vector de Inicialización (IV) único por cada operación
            const iv = crypto.randomBytes(this.CONFIG.ivLength);

            // 2. Crear el cifrador con un cast en las opciones para evitar errores de sobrecarga
            const cipher = crypto.createCipheriv(
                this.CONFIG.algorithm,
                this.masterKey,
                iv,
                { authTagLength: this.CONFIG.tagLength } as any
            ) as crypto.CipherGCM;

            // 3. Cifrar el contenido
            let encrypted = cipher.update(plainText, "utf8", "hex");
            encrypted += cipher.final("hex");

            // 4. Obtener el Auth Tag (Garantía de integridad)
            const tag = cipher.getAuthTag();

            // 5. Estructurar el paquete: [iv(12b)][tag(16b)][encrypted_data]
            // Usamos Buffer para concatenar binarios y luego pasamos a Base64 para transporte
            const result = Buffer.concat([
                iv,
                tag,
                Buffer.from(encrypted, "hex")
            ]);

            return result.toString("base64");
        } catch (error: any) {
            throw new Error(`[SecurityUtils] Encryption failed: ${error.message}`);
        }
    }

    /**
     * Descifra un string generado por el método encrypt.
     * Valida la integridad mediante el Auth Tag antes de retornar.
     * @param encryptedBase64 Cadena en base64 (iv+tag+content)
     */
    public decrypt<T = any>(encryptedBase64: string): T {
        try {
            const buffer = Buffer.from(encryptedBase64, "base64");

            // 1. Extraer las partes según las longitudes configuradas
            const iv = buffer.subarray(0, this.CONFIG.ivLength);
            const tag = buffer.subarray(this.CONFIG.ivLength, this.CONFIG.ivLength + this.CONFIG.tagLength);
            const encryptedText = buffer.subarray(this.CONFIG.ivLength + this.CONFIG.tagLength);

            // 2. Crear el descifrador con un cast en las opciones para evitar errores de sobrecarga
            const decipher = crypto.createDecipheriv(
                this.CONFIG.algorithm,
                this.masterKey,
                iv,
                { authTagLength: this.CONFIG.tagLength } as any
            ) as crypto.DecipherGCM;

            // 3. Establecer el Tag para verificar autenticidad
            decipher.setAuthTag(tag);

            // 4. Descifrar
            let decrypted = decipher.update(encryptedText, undefined, "utf8");
            decrypted += decipher.final("utf8");

            // 5. Intentar parsear si es JSON, de lo contrario retornar string
            try {
                return JSON.parse(decrypted) as T;
            } catch {
                return decrypted as unknown as T;
            }
        } catch (error: any) {
            // Si el tag falla, el error será "Unsupported state or unable to authenticate data"
            throw new Error(`[SecurityUtils] Decryption failed or data tampered: ${error.message}`);
        }
    }

    /**
       * Helper privado para estandarizar las respuestas exitosas y cifradas.
       */
    public sendEncryptedResponse(res: Response, data: any, code: number): Response {
        return res.status(code).json({
            payload: data,
            encrypted: true,
            timestamp: new Date().toISOString()
        });
    }

    /**
      * Helper privado para estandarizar las respuestas exitosas y cifradas.
      */
    public sendEncrypted(data: any, code: boolean): any {
        return {
            payload: data,
            status: code,
            timestamp: new Date().toISOString()
        };
    }
}