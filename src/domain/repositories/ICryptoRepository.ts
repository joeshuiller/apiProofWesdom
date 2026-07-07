export interface ICryptoRepository {
    /**
     * Encripta un texto plano usando una llave pública RSA.
     */
    encryptRSA(plainText: string, publicKey: string): string;

    /**
     * Desencripta un contenido usando una llave privada RSA.
     */
    decryptRSA(encryptedText: string): string;

    /**
     * Encripta un texto plano usando una llave pública RSA.
     */
    encryptCryptoJs(data: any): string

    /**
     * Desencripta un contenido usando una llave privada RSA.
     */
    decryptCryptoJs(encryptedBase64: string, password: string): { data?: any; error?: string }

    /**
     * Desencripta un contenido usando una llave privada RSA.
     */
    decryptCryptoJsComplex(encryptedBase64: string): { data?: any; error?: string }
}