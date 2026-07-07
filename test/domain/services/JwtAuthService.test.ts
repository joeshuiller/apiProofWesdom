import { JwtAuthService } from '@domain/services/JwtAuthService'; // Ajusta la ruta a tu archivo
import jwt from 'jsonwebtoken';
import { AuthPayload } from '@app/interfaces/AuthPayload';

// 1. Mockeamos la librería jsonwebtoken completa
jest.mock('jsonwebtoken');

describe('JwtAuthService', () => {
    let service: JwtAuthService;

    // Guardamos una copia de las variables de entorno originales
    const originalEnv = process.env;

    // --- Datos de prueba ---
    const mockPayload: AuthPayload = {
        userId: '12345',
        role: "1"
    };

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.falso.token';
    const testSecret = 'mi-secreto-de-prueba-123';

    beforeAll(() => {
        // 2. Modificamos el entorno para que tenga nuestro secreto de prueba
        process.env = { ...originalEnv, JWT_SECRET: testSecret };
    });

    afterAll(() => {
        // Restauramos el entorno original al terminar todas las pruebas
        process.env = originalEnv;
    });

    beforeEach(() => {
        // 3. Instanciamos el servicio DESPUÉS de haber configurado el process.env
        // Así, 'this.secret' tomará el valor de 'testSecret'
        service = new JwtAuthService();
    });

    afterEach(() => {
        // Limpiamos los mocks entre cada prueba
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('debería generar un token firmado con el payload, el secreto y una expiración de 1h', () => {
            // Arrange
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            // Act
            const result = service.generateToken(mockPayload);

            // Assert
            expect(jwt.sign).toHaveBeenCalledTimes(1);
            // Verificamos que se llame con las opciones exactas que tienes en tu clase
            expect(jwt.sign).toHaveBeenCalledWith(mockPayload, testSecret, { expiresIn: '1h' });
            expect(result).toBe(mockToken);
        });
    });

    describe('verifyToken', () => {
        it('debería verificar el token usando el secreto y retornar el payload', () => {
            // Arrange
            (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

            // Act
            const result = service.verifyToken(mockToken);

            // Assert
            expect(jwt.verify).toHaveBeenCalledTimes(1);
            expect(jwt.verify).toHaveBeenCalledWith(mockToken, testSecret);
            expect(result).toEqual(mockPayload);
        });

        it('debería lanzar un error si el token es inválido o ha expirado', () => {
            // Arrange
            const errorMessage = 'jwt expired';
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error(errorMessage);
            });

            // Act & Assert
            // Como es síncrono, usamos una función de flecha dentro del expect
            expect(() => service.verifyToken(mockToken)).toThrow(errorMessage);
            expect(jwt.verify).toHaveBeenCalledTimes(1);
        });
    });
});