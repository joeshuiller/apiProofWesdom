// =====================================================================
// 1. MOCKS (¡Siempre arriba!)
// =====================================================================

// A. Simulamos los métodos internos del Repositorio de TypeORM
const mockTypeORMRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
};

// B. Simulamos el AppDataSource para que devuelva nuestro repositorio falso
jest.mock('@infra/database/dataSource', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => mockTypeORMRepository)
    }
}));

// C. Simulamos el Mapper para no depender de su lógica interna
const mockToEntity = jest.fn();
const mockToUpdateEntity = jest.fn();

jest.mock('@domain/services/mappers/UsersMapperService', () => {
    return {
        UsersMapperService: jest.fn().mockImplementation(() => ({
            toEntity: mockToEntity,
            toUpdateEntity: mockToUpdateEntity
        }))
    };
});

// =====================================================================
// 2. IMPORTACIONES Y SUITE DE PRUEBAS
// =====================================================================
import UsersRepository from '@domain/services/UsersRepository';
import { UsersRequestDTO } from '@app/dtos/request/UsersRequestDTO';

describe('UsersRepository', () => {
    let repository: UsersRepository;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new UsersRepository();
    });

    // --- PRUEBAS DE FINDBYID ---
    describe('findById', () => {
        it('debería retornar el usuario mapeado incluyendo sus relaciones si existe', async () => {
            const mockUserDB = { id: 1, name: 'Juan' };
            const mockMappedUser = { id: 1, name: 'Juan', isMapped: true };

            // 👇 Ahora usamos findOne en lugar de findOneBy
            mockTypeORMRepository.findOne.mockResolvedValue(mockUserDB);
            mockToUpdateEntity.mockReturnValue(mockMappedUser);

            const result = await repository.findById('1');

            // Validamos que se envíe el objeto completo con where y relations
            expect(mockTypeORMRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['typeProyectsId', 'rolesId']
            });
            expect(mockToUpdateEntity).toHaveBeenCalledWith(mockUserDB);
            expect(result).toEqual(mockMappedUser);
        });

        it('debería retornar null si el usuario no existe', async () => {
            mockTypeORMRepository.findOne.mockResolvedValue(null);

            const result = await repository.findById('99');

            expect(result).toBeNull();
            expect(mockToUpdateEntity).not.toHaveBeenCalled();
        });
    });

    // --- PRUEBAS DE FINDBYEMAIL ---
    describe('findByEmail', () => {
        it('debería consultar por email incluyendo las relaciones correctas', async () => {
            const email = 'test@test.com';
            mockTypeORMRepository.findOne.mockResolvedValue(null);

            await repository.findByEmail(email);

            expect(mockTypeORMRepository.findOne).toHaveBeenCalledWith({
                where: { email },
                relations: ['typeProyectsId', 'rolesId']
            });
        });
    });

    // --- PRUEBAS DE UPDATE ---
    describe('update', () => {
        it('debería actualizar y luego buscar el registro actualizado con sus relaciones', async () => {
            const mockDTO = { name: 'Pedro' } as UsersRequestDTO;
            const mockEntity = { name: 'Pedro', isEntity: true };
            const mockUpdatedUser = { id: 1, name: 'Pedro' };

            mockToEntity.mockReturnValue(mockEntity);
            mockTypeORMRepository.update.mockResolvedValue({ affected: 1 });

            // 👇 Simular el findById interno (que ahora también usa findOne)
            mockTypeORMRepository.findOne.mockResolvedValue(mockUpdatedUser);
            mockToUpdateEntity.mockReturnValue(mockUpdatedUser);

            const result = await repository.update('1', mockDTO);

            expect(mockToEntity).toHaveBeenCalledWith(mockDTO);
            expect(mockTypeORMRepository.update).toHaveBeenCalledWith('1', mockEntity);
            expect(result).toEqual(mockUpdatedUser);
        });
    });

    // --- PRUEBAS DE DELETE ---
    describe('delete', () => {
        it('debería retornar true si affected > 0', async () => {
            mockTypeORMRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await repository.delete(1);

            expect(mockTypeORMRepository.delete).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it('debería retornar false si affected es 0', async () => {
            mockTypeORMRepository.delete.mockResolvedValue({ affected: 0 });

            const result = await repository.delete(1);

            expect(result).toBe(false);
        });
    });

    // --- PRUEBAS DE SAVE ---
    describe('save', () => {
        it('debería transformar el DTO a Entity, guardar y retornar la respuesta mapeada', async () => {
            const mockDTO = { name: 'Maria' } as UsersRequestDTO;
            mockToEntity.mockReturnValue({ isEntity: true });
            mockTypeORMRepository.save.mockResolvedValue({ id: 2, isEntity: true });
            mockToUpdateEntity.mockReturnValue({ id: 2, name: 'Maria' });

            const result = await repository.save(mockDTO);

            expect(mockTypeORMRepository.save).toHaveBeenCalled();
            expect(result).toEqual({ id: 2, name: 'Maria' });
        });
    });

    // --- PRUEBAS DE FINDALL ---
    describe('findAll', () => {
        it('debería retornar un arreglo mapeado de usuarios', async () => {
            const mockDBUsers = [{ id: 1 }, { id: 2 }];
            mockTypeORMRepository.find.mockResolvedValue(mockDBUsers);
            mockToUpdateEntity.mockReturnValue({ mapped: true });

            const result = await repository.findAll(10, 5);

            expect(mockTypeORMRepository.find).toHaveBeenCalledWith({
                where: { typeProyectsId: { id: 10 }, rolesId: { id: 5 } },
                relations: ['typeProyectsId'] // Como lo tienes en tu código actual
            });
            expect(result?.length).toBe(2);
            expect(mockToUpdateEntity).toHaveBeenCalledTimes(2);
        });

        it('debería retornar null si la base de datos devuelve un arreglo vacío', async () => {
            mockTypeORMRepository.find.mockResolvedValue([]);

            const result = await repository.findAll(10, 5);

            expect(result).toBeNull();
            expect(mockToUpdateEntity).not.toHaveBeenCalled();
        });
    });
});