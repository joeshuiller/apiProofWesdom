import { UserPasswordUseCase } from '@app/use-cases/UserPasswordUseCase'; // Ajusta la ruta a tu archivo
import { IPasswordHasher } from '@domain/repositories/IPasswordHasher';

describe('UserPasswordUseCase', () => {
    let useCase: UserPasswordUseCase;
    let mockHasher: jest.Mocked<IPasswordHasher>;

    beforeEach(() => {
        // 1. Creamos el mock de la interfaz IPasswordHasher
        mockHasher = {
            hash: jest.fn(),
            compare: jest.fn(),
        };

        // 2. Instanciamos el caso de uso inyectando nuestro mock
        useCase = new UserPasswordUseCase(mockHasher);
    });

    afterEach(() => {
        // Limpiamos los mocks después de cada prueba para evitar que se crucen datos
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('debería encriptar la contraseña y retornar el hash', async () => {
            // Arrange (Preparar)
            const plainTextPassword = 'MiPasswordSuperSeguro123';
            const expectedHash = '$2b$10$EjemploDeUnHashGeneradoPorBcrypt...'; // Simulamos un hash

            mockHasher.hash.mockResolvedValue(expectedHash);

            // Act (Actuar)
            const result = await useCase.create(plainTextPassword);

            // Assert (Afirmar)
            expect(mockHasher.hash).toHaveBeenCalledTimes(1);
            expect(mockHasher.hash).toHaveBeenCalledWith(plainTextPassword);
            expect(result).toBe(expectedHash);
        });
    });

    describe('compare', () => {
        it('debería retornar true si la contraseña coincide con el hash', async () => {
            // Arrange
            const plainTextPassword = 'MiPasswordSuperSeguro123';
            const savedHash = '$2b$10$EjemploDeUnHashGeneradoPorBcrypt...';

            mockHasher.compare.mockResolvedValue(true);

            // Act
            const result = await useCase.compare(plainTextPassword, savedHash);

            // Assert
            expect(mockHasher.compare).toHaveBeenCalledTimes(1);
            expect(mockHasher.compare).toHaveBeenCalledWith(plainTextPassword, savedHash);
            expect(result).toBe(true);
        });

        it('debería retornar false si la contraseña NO coincide con el hash', async () => {
            // Arrange
            const wrongPassword = 'PasswordIncorrecto';
            const savedHash = '$2b$10$EjemploDeUnHashGeneradoPorBcrypt...';

            mockHasher.compare.mockResolvedValue(false);

            // Act
            const result = await useCase.compare(wrongPassword, savedHash);

            // Assert
            expect(mockHasher.compare).toHaveBeenCalledTimes(1);
            expect(mockHasher.compare).toHaveBeenCalledWith(wrongPassword, savedHash);
            expect(result).toBe(false);
        });
    });
});