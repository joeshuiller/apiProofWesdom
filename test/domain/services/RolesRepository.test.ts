import RolesRepository from '@domain/services/RolesRepository'; // Ajusta la ruta a tu archivo
import { RolesRequestDTO } from '@app/dtos/request/RolesRequestDTO';
import { RolesResponseDTO } from '@app/dtos/response/RolesResponseDTO';
import { RolesEntity } from '@domain/entities/RolesEntity';

// 1. Preparamos las funciones simuladas para TypeORM
const mockTypeOrmRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
};

// 2. Mockeamos el AppDataSource para que devuelva nuestro repositorio falso
jest.mock('@infra/database/dataSource', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => mockTypeOrmRepository),
    },
}));

// 3. Preparamos las funciones simuladas para el Mapper
const mockToEntity = jest.fn();
const mockToUpdateEntity = jest.fn();

// 4. Mockeamos la clase RolesMapperService
jest.mock('@domain/services/mappers/RolesMapperService', () => {
    return {
        RolesMapperService: jest.fn().mockImplementation(() => ({
            toEntity: mockToEntity,
            toUpdateEntity: mockToUpdateEntity,
        })),
    };
});

describe('RolesRepository', () => {
    let repository: RolesRepository;

    // --- Datos de prueba ---
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
    const mockEntity: RolesEntity = {
        id: 1,
        name: 'ADMIN',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        // Limpiamos los mocks antes de instanciar
        jest.clearAllMocks();

        // Instanciamos nuestro repositorio
        // Al hacerlo, ejecutará AppDataSource.getRepository y new RolesMapperService()
        repository = new RolesRepository();
    });

    describe('findByAll', () => {
        it('debería retornar un arreglo de roles mapeados a DTOs', async () => {
            // Arrange
            mockTypeOrmRepository.find.mockResolvedValue([mockEntity, mockEntity]);
            mockToUpdateEntity.mockReturnValue(mockResponseDto);

            // Act
            const result = await repository.findByAll();

            // Assert
            expect(mockTypeOrmRepository.find).toHaveBeenCalledTimes(1);
            // El mapper debió llamarse 2 veces (una por cada entidad en el arreglo)
            expect(mockToUpdateEntity).toHaveBeenCalledTimes(2);
            expect(mockToUpdateEntity).toHaveBeenCalledWith(mockEntity);
            expect(result).toEqual([mockResponseDto, mockResponseDto]);
        });

        it('debería retornar un arreglo vacío si no hay registros', async () => {
            mockTypeOrmRepository.find.mockResolvedValue([]);

            const result = await repository.findByAll();

            expect(mockTypeOrmRepository.find).toHaveBeenCalledTimes(1);
            expect(mockToUpdateEntity).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe('findById', () => {
        it('debería retornar el DTO mapeado si el rol existe', async () => {
            // Arrange
            const testId = '1';
            mockTypeOrmRepository.findOneBy.mockResolvedValue(mockEntity);
            mockToUpdateEntity.mockReturnValue(mockResponseDto);

            // Act
            const result = await repository.findById(testId);

            // Assert
            expect(mockTypeOrmRepository.findOneBy).toHaveBeenCalledTimes(1);
            // Verifica que hayas convertido el string a number usando parseInt
            expect(mockTypeOrmRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(mockToUpdateEntity).toHaveBeenCalledWith(mockEntity);
            expect(result).toEqual(mockResponseDto);
        });

        it('debería retornar null si el rol no existe', async () => {
            mockTypeOrmRepository.findOneBy.mockResolvedValue(null);

            const result = await repository.findById('99');

            expect(result).toBeNull();
            expect(mockToUpdateEntity).not.toHaveBeenCalled();
        });
    });

    describe('findByName', () => {
        it('debería retornar el DTO mapeado si el rol existe por nombre', async () => {
            const testName = 'ADMIN';
            mockTypeOrmRepository.findOneBy.mockResolvedValue(mockEntity);
            mockToUpdateEntity.mockReturnValue(mockResponseDto);

            const result = await repository.findByName(testName);

            expect(mockTypeOrmRepository.findOneBy).toHaveBeenCalledWith({ name: testName });
            expect(result).toEqual(mockResponseDto);
        });

        it('debería retornar null si no encuentra el nombre', async () => {
            mockTypeOrmRepository.findOneBy.mockResolvedValue(null);
            const result = await repository.findByName('INEXISTENTE');
            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('debería actualizar la entidad y luego retornar el registro buscado por ID', async () => {
            // Arrange
            const testId = '1';
            mockToEntity.mockReturnValue(mockEntity); // Para el .update()

            // El método update internamente llama a this.findById(), así que mockeamos su flujo:
            mockTypeOrmRepository.findOneBy.mockResolvedValue(mockEntity);
            mockToUpdateEntity.mockReturnValue(mockResponseDto);

            // Act
            const result = await repository.update(testId, mockRequestDto);

            // Assert
            // 1. Verificamos la conversión del DTO a Entidad
            expect(mockToEntity).toHaveBeenCalledWith(mockRequestDto);
            // 2. Verificamos la actualización en BD
            expect(mockTypeOrmRepository.update).toHaveBeenCalledWith(testId, mockEntity);
            // 3. Verificamos que al final retornó el objeto actualizado
            expect(result).toEqual(mockResponseDto);
        });
    });

    describe('delete', () => {
        it('debería retornar true si se afectó al menos una fila', async () => {
            const testId = 1;
            // Simulamos la respuesta de TypeORM para DeleteResult
            mockTypeOrmRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await repository.delete(testId);

            expect(mockTypeOrmRepository.delete).toHaveBeenCalledWith(testId);
            expect(result).toBe(true);
        });

        it('debería retornar false si no se afectó ninguna fila (affected === 0)', async () => {
            mockTypeOrmRepository.delete.mockResolvedValue({ affected: 0 });
            const result = await repository.delete(99);
            expect(result).toBe(false);
        });

        it('debería retornar false si affected es undefined', async () => {
            mockTypeOrmRepository.delete.mockResolvedValue({ affected: undefined });
            const result = await repository.delete(99);
            expect(result).toBe(false);
        });
    });

    describe('save', () => {
        it('debería convertir el DTO, guardarlo en BD, reconvertirlo y retornarlo', async () => {
            // Arrange
            mockToEntity.mockReturnValue(mockEntity);
            mockTypeOrmRepository.save.mockResolvedValue(mockEntity);
            mockToUpdateEntity.mockReturnValue(mockResponseDto);

            // Act
            const result = await repository.save(mockRequestDto);

            // Assert
            expect(mockToEntity).toHaveBeenCalledWith(mockRequestDto);
            expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(mockEntity);
            expect(mockToUpdateEntity).toHaveBeenCalledWith(mockEntity);
            expect(result).toEqual(mockResponseDto);
        });
    });
});