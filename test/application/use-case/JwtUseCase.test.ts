import { JwtUseCase } from '@app/use-cases/JwtUseCase'; // Ajusta la ruta a tu archivo
import { IAuthService } from '@domain/repositories/IAuthService';
import { AuthPayload } from '@app/interfaces/AuthPayload';

describe('JwtUseCase', () => {
    let jwtUseCase: JwtUseCase;
    let mockAuthService: jest.Mocked<IAuthService>;

    // Datos de prueba simulados
    const mockPayload: AuthPayload = {
        userId: '12345',
        role: "1"
    };
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockPayload.mockSignature';

    beforeEach(() => {
        // 1. Creamos el mock del servicio con sus métodos
        mockAuthService = {
            generateToken: jest.fn(),
            verifyToken: jest.fn(),
        };

        // 2. Instanciamos el caso de uso inyectando el mock
        jwtUseCase = new JwtUseCase(mockAuthService);
    });

    afterEach(() => {
        // Limpiamos los mocks después de cada test para evitar interferencias
        jest.clearAllMocks();
    });

    describe('generateToken', () => {
        it('debería generar un token delegando al IAuthService', () => {
            // Arrange
            mockAuthService.generateToken.mockReturnValue(mockToken);

            // Act
            const result = jwtUseCase.generateToken(mockPayload);

            // Assert
            expect(mockAuthService.generateToken).toHaveBeenCalledTimes(1);
            expect(mockAuthService.generateToken).toHaveBeenCalledWith(mockPayload);
            expect(result).toBe(mockToken);
        });
    });

    describe('verifyToken', () => {
        it('debería verificar un token y devolver el payload delegando al IAuthService', () => {
            // Arrange
            mockAuthService.verifyToken.mockReturnValue(mockPayload);

            // Act
            const result = jwtUseCase.verifyToken(mockToken);

            // Assert
            expect(mockAuthService.verifyToken).toHaveBeenCalledTimes(1);
            expect(mockAuthService.verifyToken).toHaveBeenCalledWith(mockToken);
            expect(result).toEqual(mockPayload);
        });

        it('debería propagar el error si el IAuthService falla al verificar el token', () => {
            // Arrange
            const errorMessage = 'jwt expired';
            mockAuthService.verifyToken.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            // Act & Assert
            // Como el método es síncrono, usamos una función de flecha dentro de expect()
            expect(() => jwtUseCase.verifyToken(mockToken)).toThrow(errorMessage);
            expect(mockAuthService.verifyToken).toHaveBeenCalledTimes(1);
        });
    });
});