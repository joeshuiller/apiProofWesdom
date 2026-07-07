import { UsersUseCase } from '@app/use-cases/UsersUseCase'; // Ajusta la ruta
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { UserPasswordUseCase } from '@app/use-cases/UserPasswordUseCase'; // Ajusta la ruta
import { container } from '@infra/di/inversifyConfig'; // Ajusta la ruta
import { UsersRequestDTO } from '@app/dtos/request/UsersRequestDTO';
import { UsersResponseDTO } from '@app/dtos/response/UsersResponseDTO';
import { TYPES } from '@app/dtos/models/types';

// 1. Mockeamos el módulo del contenedor de Inversify ANTES de instanciar cualquier cosa
jest.mock('@infra/di/inversifyConfig', () => ({
    container: {
        get: jest.fn(),
    },
}));

describe('UsersUseCase', () => {
    let useCase: UsersUseCase;
    let mockUserRepository: jest.Mocked<IUserRepository>;
    let mockPasswordUseCase: jest.Mocked<UserPasswordUseCase>;

    beforeEach(() => {
        // 2. Creamos los mocks de nuestras dependencias
        mockUserRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
        } as unknown as jest.Mocked<IUserRepository>;

        mockPasswordUseCase = {
            create: jest.fn(),
            compare: jest.fn(),
        } as unknown as jest.Mocked<UserPasswordUseCase>;

        // 3. Le decimos al mock del contenedor que devuelva nuestro mock de UserPasswordUseCase
        (container.get as jest.Mock).mockReturnValue(mockPasswordUseCase);

        // 4. Instanciamos el caso de uso
        useCase = new UsersUseCase(mockUserRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('debería resolver UserPasswordUseCase desde el contenedor', () => {
            // Verificamos que al hacer el 'new UsersUseCase', haya llamado al container
            expect(container.get).toHaveBeenCalledWith(TYPES.UserPasswordUseCase);
        });
    });

    describe('create', () => {
        it('debería hashear la contraseña y luego guardar el usuario', async () => {
            // Arrange
            const mockRequestDto: UsersRequestDTO = {
                name: 'Juan',
                surName: 'Juan',
                email: 'juan@test.com',
                password: 'passwordPlano123',
                imgClients: 'imgClients',
                telephone: 'telephone',
                active: true,
                rolesId: 1,
                typeProyectsId: 1,
            };

            const mockResponseDto: UsersResponseDTO = {
                id: 1,
                name: 'Juan',
                surName: 'Juan',
                email: 'juan@test.com',
                imgClients: 'imgClients',
                telephone: 'telephone',
                password: 'passwordPlano123',
                active: true,
                rolesId: 1,
                typeProyectsId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const hashedPassword = 'hashedPassword123!';

            // Simulamos que el passwordUseCase devuelve el hash
            mockPasswordUseCase.create.mockResolvedValue(hashedPassword);
            // Simulamos que el repositorio guarda exitosamente
            mockUserRepository.save.mockResolvedValue(mockResponseDto);

            // Act
            const result = await useCase.create(mockRequestDto);

            // Assert
            expect(mockPasswordUseCase.create).toHaveBeenCalledTimes(1);
            expect(mockPasswordUseCase.create).toHaveBeenCalledWith('passwordPlano123');

            // Verificamos que al repositorio le haya llegado el DTO mutado con el hash
            expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
            expect(mockUserRepository.save).toHaveBeenCalledWith({
                ...mockRequestDto,
                password: hashedPassword, // El password fue sobreescrito
            });

            expect(result).toEqual(mockResponseDto);
        });
    });

    describe('findById', () => {
        it('debería retornar un usuario por su ID', async () => {
            const testId = "1";
            const mockResponseDto: UsersResponseDTO = {
                id: 1,
                name: 'Juan',
                surName: 'Juan',
                email: 'juan@test.com',
                imgClients: 'imgClients',
                telephone: 'telephone',
                password: 'passwordPlano123',
                active: true,
                rolesId: 1,
                typeProyectsId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockUserRepository.findById.mockResolvedValue(mockResponseDto);

            const result = await useCase.findById(testId);

            expect(mockUserRepository.findById).toHaveBeenCalledWith(testId);
            expect(result).toEqual(mockResponseDto);
        });
    });

    describe('findByEmail', () => {
        it('debería retornar un usuario por su email', async () => {
            const testEmail = 'test@test.com';
            const mockResponseDto: UsersResponseDTO = {
                id: 1,
                name: 'Juan',
                surName: 'Juan',
                email: 'test@test.com',
                imgClients: 'imgClients',
                telephone: 'telephone',
                password: 'passwordPlano123',
                active: true,
                rolesId: 1,
                typeProyectsId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockUserRepository.findByEmail.mockResolvedValue(mockResponseDto);

            const result = await useCase.findByEmail(testEmail);

            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(testEmail);
            expect(result).toEqual(mockResponseDto);
        });
    });

    describe('update', () => {
        it('debería actualizar y retornar el usuario', async () => {
            const testId = "1";
            const mockRequestDto: UsersRequestDTO = {
                name: 'Pedro',
                surName: 'Juan',
                email: 'juan@test.com',
                imgClients: 'imgClients',
                telephone: 'telephone',
                password: 'passwordPlano123',
                active: true,
                rolesId: 1,
                typeProyectsId: 1,
            };
            const mockResponseDto: UsersResponseDTO = {
                id: 1,
                name: 'Pedro',
                surName: 'Juan',
                email: 'juan@test.com',
                imgClients: 'imgClients',
                telephone: 'telephone',
                password: 'passwordPlano123',
                active: true,
                rolesId: 1,
                typeProyectsId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockUserRepository.update.mockResolvedValue(mockResponseDto);

            const result = await useCase.update(testId, mockRequestDto);

            expect(mockUserRepository.update).toHaveBeenCalledWith(testId, mockRequestDto);
            expect(result).toEqual(mockResponseDto);
        });
    });

    describe('delete', () => {
        it('debería eliminar el usuario y retornar un booleano', async () => {
            const testId = 1; // Aquí delete recibe un number
            mockUserRepository.delete.mockResolvedValue(true);

            const result = await useCase.delete(testId);

            expect(mockUserRepository.delete).toHaveBeenCalledWith(testId);
            expect(result).toBe(true);
        });
    });

    describe('findAll', () => {
        it('debería retornar una lista de usuarios basada en el id y idRol', async () => {
            const id = 1;
            const idRol = 1;
            const mockResponseList: UsersResponseDTO[] = [{
                id: 1,
                name: 'Juan',
                surName: 'Juan',
                email: 'juan@test.com',
                imgClients: 'imgClients',
                telephone: 'telephone',
                password: 'passwordPlano123',
                active: true,
                rolesId: 1,
                typeProyectsId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            }, {
                id: 2,
                name: 'Juan',
                surName: 'Juan',
                email: 'juan@test.com',
                imgClients: 'imgClients',
                telephone: 'telephone',
                password: 'passwordPlano123',
                active: true,
                rolesId: 1,
                typeProyectsId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            }];

            mockUserRepository.findAll.mockResolvedValue(mockResponseList);

            const result = await useCase.findAll(id, idRol);

            expect(mockUserRepository.findAll).toHaveBeenCalledWith(id, idRol);
            expect(result).toEqual(mockResponseList);
        });
    });
});