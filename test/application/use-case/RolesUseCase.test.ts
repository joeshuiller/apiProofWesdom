import { RolesUseCase } from '@app/use-cases/RolesUseCase'; // Ajusta la ruta si es necesario
import { IRolesRepository } from '@domain/repositories/IRolesRepository';
import { RolesRequestDTO } from '@app/dtos/request/RolesRequestDTO';
import { RolesResponseDTO } from '@app/dtos/response/RolesResponseDTO';

describe('RolesUseCase', () => {
    let rolesUseCase: RolesUseCase;
    let mockRolesRepository: jest.Mocked<IRolesRepository>;

    // --- Datos de prueba simulados ---
    const mockRequestDto: RolesRequestDTO = {
        name: 'ADMIN',
        active: true,
    };

    const mockResponseDto: RolesResponseDTO = {
        id: 1,
        name: 'ADMIN',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        // 1. Creamos el mock del repositorio con todas sus funciones
        mockRolesRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findByName: jest.fn(),
        };

        // 2. Instanciamos el caso de uso inyectando el mock
        rolesUseCase = new RolesUseCase(mockRolesRepository);
    });

    afterEach(() => {
        // Limpiamos los mocks después de cada prueba
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('debería crear un rol y devolver el DTO de respuesta', async () => {
            // Arrange
            mockRolesRepository.save.mockResolvedValue(mockResponseDto);

            // Act
            const result = await rolesUseCase.create(mockRequestDto);

            // Assert
            expect(mockRolesRepository.save).toHaveBeenCalledTimes(1);
            expect(mockRolesRepository.save).toHaveBeenCalledWith(mockRequestDto);
            expect(result).toEqual(mockResponseDto);
        });

        it('debería devolver null si el repositorio falla silenciosamente (retorna null)', async () => {
            mockRolesRepository.save.mockResolvedValue(null);
            const result = await rolesUseCase.create(mockRequestDto);
            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('debería buscar un rol por ID y devolverlo', async () => {
            const testId = '1';
            mockRolesRepository.findById.mockResolvedValue(mockResponseDto);

            const result = await rolesUseCase.findById(testId);

            expect(mockRolesRepository.findById).toHaveBeenCalledTimes(1);
            expect(mockRolesRepository.findById).toHaveBeenCalledWith(testId);
            expect(result).toEqual(mockResponseDto);
        });
    });

    describe('findByAll', () => {
        it('debería devolver un arreglo de roles', async () => {
            const mockArray = [mockResponseDto];
            mockRolesRepository.findByAll.mockResolvedValue(mockArray);

            const result = await rolesUseCase.findByAll();

            expect(mockRolesRepository.findByAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockArray);
        });

        it('debería devolver un arreglo vacío si no hay roles', async () => {
            mockRolesRepository.findByAll.mockResolvedValue([]);

            const result = await rolesUseCase.findByAll();

            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('debería actualizar un rol y devolver el DTO actualizado', async () => {
            const testId = '1';
            mockRolesRepository.update.mockResolvedValue(mockResponseDto);

            const result = await rolesUseCase.update(testId, mockRequestDto);

            expect(mockRolesRepository.update).toHaveBeenCalledTimes(1);
            expect(mockRolesRepository.update).toHaveBeenCalledWith(testId, mockRequestDto);
            expect(result).toEqual(mockResponseDto);
        });
    });

    describe('delete', () => {
        it('debería eliminar un rol por ID y devolver true', async () => {
            const testId = 1; // Ojo: tu método delete recibe un number, no un string
            mockRolesRepository.delete.mockResolvedValue(true);

            const result = await rolesUseCase.delete(testId);

            expect(mockRolesRepository.delete).toHaveBeenCalledTimes(1);
            expect(mockRolesRepository.delete).toHaveBeenCalledWith(testId);
            expect(result).toBe(true);
        });

        it('debería devolver false si no se pudo eliminar', async () => {
            const testId = 99;
            mockRolesRepository.delete.mockResolvedValue(false);

            const result = await rolesUseCase.delete(testId);

            expect(result).toBe(false);
        });
    });
});