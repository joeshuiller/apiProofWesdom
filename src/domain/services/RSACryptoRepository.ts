import { injectable } from "inversify";
import { ICryptoRepository } from "@domain/repositories/ICryptoRepository";
import JSEncrypt from "jsencrypt";
import * as crypto from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';

@injectable()
export class RSACryptoRepository implements ICryptoRepository {
    private readonly SEPARATOR = "|||PASS_DATA|||";
    private readonly MAGIC_SALTED = "Salted__";

    public encryptRSA(plainText: string, publicKey: string): string {
        const encryptor = new JSEncrypt();
        encryptor.setPublicKey(publicKey);

        const result = encryptor.encrypt(plainText);

        if (!result) {
            throw new Error("RSA_ENCRYPT_ERROR: Fallo al cifrar con la llave pública proporcionada.");
        }

        return result;
    }

    public decryptRSA(encryptedText: string): string {
        const decryptor = new JSEncrypt();
        // Definir la ruta al archivo
        const certPath = path.join(process.cwd(), 'config/key/privada.pem');
        console.log("certPath", certPath);
        // Leer el contenido como string UTF-8
        const pemContent = fs.readFileSync(certPath, 'utf8');

        decryptor.setPrivateKey(pemContent);

        const result = decryptor.decrypt(encryptedText);

        if (!result) {
            throw new Error("RSA_DECRYPT_ERROR: No se pudo descifrar el contenido. Llave privada inválida o datos corruptos.");
        }

        return result as string;
    }

    /**
     * Encripta datos generando una contraseña dinámica y un paquete compatible con OpenSSL.
     * @param data Datos a cifrar (String u Objeto).
     * @returns String Base64: [PASS]|||PASS_DATA|||[Salted__][SALT][CIPHERTEXT]
     */
    public encryptCryptoJs(data: any): string {
        try {
            const plainText = typeof data === 'string' ? data : JSON.stringify(data);

            // 1. Generar Password Dinámica (16 bytes -> hex = 32 caracteres)
            const dynamicPassword = crypto.randomBytes(16).toString('hex');

            // 2. Generar Salt binario de 8 bytes (estándar OpenSSL)
            const salt = crypto.randomBytes(8);

            // 3. Derivación de Key e IV usando el algoritmo EVP_BytesToKey (Legacy OpenSSL)
            const { key, iv } = this.deriveEvpBytesToKey(dynamicPassword, salt);

            // 4. Cifrado AES-256-CBC
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            let cipherText = cipher.update(plainText, 'utf8');
            cipherText = Buffer.concat([cipherText, cipher.final()]);

            // 5. Construir payload interno: "Salted__" + Salt + CipherText
            const saltedPrefix = Buffer.from(this.MAGIC_SALTED, 'utf8');
            const innerPayload = Buffer.concat([saltedPrefix, salt, cipherText]);

            // 6. Armar paquete final con separador
            const finalString = dynamicPassword + this.SEPARATOR + innerPayload.toString('binary');

            return Buffer.from(finalString, 'binary').toString('base64');
        } catch (error: any) {
            console.error("[NodeCrypto] Error en encriptación:", error.message);
            throw new Error("Fallo crítico en el motor de cifrado.");
        }
    }

    /**
     * Desencripta un paquete que contiene la contraseña embebida.
     * @param encryptedBase64 Paquete en base64.
     * @returns Objeto con los datos o error.
     */
    public decryptCryptoJsComplex(encryptedBase64: string): { data?: any; error?: string } {
        try {
            // 1. Decodificar Base64 preservando binarios
            const decodedRaw = Buffer.from(encryptedBase64, 'base64').toString('binary');

            if (!decodedRaw.includes(this.SEPARATOR)) {
                return { error: "Formato de datos no válido o separador ausente" };
            }

            // 2. Separar Password de los datos binarios
            const parts = decodedRaw.split(this.SEPARATOR);
            const password = parts[0];
            const payloadBinary = Buffer.from(parts[1], 'binary');

            // 3. Validar firma "Salted__"
            if (payloadBinary.subarray(0, 8).toString() !== this.MAGIC_SALTED) {
                return { error: "Firma de cifrado ausente (Not Salted)" };
            }

            // 4. Extraer Salt (8 bytes) y Ciphertext (el resto)
            const salt = payloadBinary.subarray(8, 16);
            const cipherText = payloadBinary.subarray(16);

            // 5. Derivar credenciales
            const { key, iv } = this.deriveEvpBytesToKey(password, salt);

            // 6. Descifrado AES-256-CBC
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(cipherText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            const plainText = decrypted.toString('utf8');

            // 7. Intentar parsear si es JSON
            try {
                return { data: JSON.parse(plainText) };
            } catch {
                return { data: plainText };
            }

        } catch (error: any) {
            console.error("[NodeCrypto] Error crítico desencriptando:", error.message);
            return { error: "Error interno procesando la solicitud de descifrado" };
        }
    }

    /**
     * Portabilidad del método PHP decryptCryptoJs.
     * Desencripta un payload estándar de OpenSSL proporcionando la contraseña manualmente.
     * @param encryptedBase64 El texto encriptado en formato Base64 (debe contener Salted__).
     * @param password La contraseña o frase secreta.
     * @returns Objeto con 'data' o 'error' según el resultado.
     */
    public decryptCryptoJs(encryptedBase64: string, password: string): { data?: any; error?: string } {
        try {
            // 1. Decodificar Base64
            const data = Buffer.from(encryptedBase64, 'base64');

            // 2. Validar que contenga la firma de OpenSSL / CryptoJS
            if (data.length < 16 || data.subarray(0, 8).toString() !== this.MAGIC_SALTED) {
                return { error: "Formato de datos no válido o firma ausente" };
            }

            // 3. Extraer Salt (8 bytes después de la firma) y el texto cifrado
            const salt = data.subarray(8, 16);
            const cipherText = data.subarray(16);

            // 4. Delegar la creación de la llave al método especializado (EVP_BytesToKey)
            const { key, iv } = this.deriveEvpBytesToKey(password, salt);

            // 5. Descifrar usando AES-256-CBC
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(cipherText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            const plainText = decrypted.toString('utf8');

            // Intentar retornar como objeto si es un JSON válido
            try {
                return { data: JSON.parse(plainText) };
            } catch {
                return { data: plainText };
            }

        } catch (error: any) {
            // Captura errores de formato o clave incorrecta (equivalente a InvalidArgumentException en tu PHP)
            if (error.message.includes('bad decrypt') || error.message.includes('wrong final block length')) {
                return { error: "Fallo al desencriptar. Verifica la clave o el texto." };
            }

            // Captura errores graves del sistema (equivalente a Throwable y Log::error en PHP)
            console.error("[NodeCrypto] Error crítico desencriptando CryptoJS:", error.message);
            return { error: "Error interno procesando la solicitud" };
        }
    }

    /**
     * Implementación exacta de EVP_BytesToKey (Legacy OpenSSL KDF).
     * Requerido para que Node sea compatible con openssl_encrypt de PHP y CryptoJS.
     * @private
     */
    private deriveEvpBytesToKey(password: string, salt: Buffer): { key: Buffer; iv: Buffer } {
        const passwordBuffer = Buffer.from(password, 'utf8');
        let derivedBytes = Buffer.alloc(0);
        let currentHash = Buffer.alloc(0);

        // Para AES-256-CBC necesitamos: 32 bytes (Key) + 16 bytes (IV) = 48 bytes totales
        while (derivedBytes.length < 48) {
            const hasher = crypto.createHash('md5');
            // La concatenación es: [Hash Anterior] + Password + Salt
            hasher.update(Buffer.concat([currentHash, passwordBuffer, salt]));
            currentHash = hasher.digest();
            derivedBytes = Buffer.concat([derivedBytes, currentHash]);
        }

        return {
            key: derivedBytes.subarray(0, 32),
            iv: derivedBytes.subarray(32, 48)
        };
    }
}