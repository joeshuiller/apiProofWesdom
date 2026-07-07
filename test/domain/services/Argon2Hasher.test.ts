import { Argon2Hasher } from '@domain/services/Argon2Hasher'; // Ajusta la ruta
import argon2 from 'argon2';

// 1. Interceptamos y mockeamos la librería externa completa
jest.mock('argon2', () => ({
    hash: jest.fn(),
    verify: jest.fn(),
    argon2id: 2, // argon2.argon2id es una constante numérica en la librería real, la simulamos aquí
}));

describe('Argon2Hasher', () => {
    let hasher: Argon2Hasher;

    beforeEach(() => {
        // Como esta clase no recibe dependencias en su constructor, la instanciamos limpia
        hasher = new Argon2Hasher();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('hash', () => {
        it('debería encriptar la contraseña usando argon2 con la configuración de seguridad correcta', async () => {
            // Arrange
            const plainText = 'MiPasswordSuperSeguro123!';
            const fakeHash = '$argon2id$v=19$m=65536,t=3,p=1$salFalsa$hashFalso';

            // Le decimos al mock de la librería qué devolver
            (argon2.hash as jest.Mock).mockResolvedValue(fakeHash);

            // Act
            const result = await hasher.hash(plainText);

            // Assert
            expect(argon2.hash).toHaveBeenCalledTimes(1);
            // Verificamos que se llame con el texto plano y las opciones exactas que definiste
            expect(argon2.hash).toHaveBeenCalledWith(plainText, {
                type: argon2.argon2id,
                memoryCost: 65536, // 2 ** 16
                timeCost: 3,
                parallelism: 1,
            });
            expect(result).toBe(fakeHash);
        });
    });

    describe('compare', () => {
        it('debería devolver true si la contraseña coincide con el hash', async () => {
            // Arrange
            const plainText = 'MiPasswordSuperSeguro123!';
            const fakeHash = '$argon2id$v=19$m=65536,t=3,p=1$salFalsa$hashFalso';

            (argon2.verify as jest.Mock).mockResolvedValue(true);

            // Act
            const result = await hasher.compare(plainText, fakeHash);

            // Assert
            expect(argon2.verify).toHaveBeenCalledTimes(1);
            // ¡OJO AQUÍ! argon2.verify recibe primero el hash y luego el texto plano
            expect(argon2.verify).toHaveBeenCalledWith(fakeHash, plainText);
            expect(result).toBe(true);
        });

        it('debería devolver false si la contraseña NO coincide con el hash', async () => {
            // Arrange
            const wrongPassword = 'PasswordIncorrecto';
            const fakeHash = '$argon2id$v=19$m=65536,t=3,p=1$salFalsa$hashFalso';

            (argon2.verify as jest.Mock).mockResolvedValue(false);

            // Act
            const result = await hasher.compare(wrongPassword, fakeHash);

            // Assert
            expect(argon2.verify).toHaveBeenCalledTimes(1);
            expect(argon2.verify).toHaveBeenCalledWith(fakeHash, wrongPassword);
            expect(result).toBe(false);
        });
    });
});