// =====================================================================
// 1. IMPORTACIONES
// =====================================================================
import { UsersMapperService } from '@domain/services/mappers/UsersMapperService';
import { UsersEntity } from '@domain/entities/UsersEntity';
import { UsersRequestDTO } from '@app/dtos/request/UsersRequestDTO';
import { RolesEntity } from '@domain/entities/RolesEntity';
import { TypeProyectsEntity } from '@domain/entities/TypeProyectsEntity';

describe('UsersMapperService', () => {
    let mapper: UsersMapperService;

    beforeEach(() => {
        mapper = new UsersMapperService();
    });

    // =================================================================
    // PRUEBA 1: toDTO (De Entity a Request DTO)
    // =================================================================
    describe('toDTO', () => {
        it('debería transformar un UsersEntity en un UsersRequestDTO aplanando las relaciones', () => {
            // Arrange: Creamos un Entity falso (simulando lo que llega de la DB)
            const mockEntity = {
                id: 100,
                name: 'Juan',
                surName: 'Perez',
                email: 'juan@test.com',
                password: 'hashedpassword',
                imgClients: 'avatar.jpg',
                telephone: '573001234567',
                active: true,
                rolesId: { id: 2 } as RolesEntity,
                typeProyectsId: { id: 5 } as TypeProyectsEntity,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as UsersEntity;

            // Act: Ejecutamos el mapper
            const result = mapper.toDTO(mockEntity);

            // Assert: Verificamos que los datos simples se copiaron
            expect(result.name).toBe(mockEntity.name);
            expect(result.surName).toBe(mockEntity.surName);
            expect(result.email).toBe(mockEntity.email);
            expect(result.password).toBe(mockEntity.password);
            expect(result.imgClients).toBe(mockEntity.imgClients);
            expect(result.active).toBe(mockEntity.active);

            // Verificación crítica: Asegurarnos de que extrajo el 'id' de los objetos relacionales
            expect(result.rolesId).toBe(mockEntity.rolesId.id); // Debe ser 2
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id); // Debe ser 5
        });
    });

    // =================================================================
    // PRUEBA 2: toEntity (De Request DTO a Entity)
    // =================================================================
    describe('toEntity', () => {
        it('debería transformar un UsersRequestDTO en un UsersEntity anidando los IDs relacionales', () => {
            // Arrange: Creamos un DTO falso (lo que envía el usuario desde el frontend)
            const mockDTO = new UsersRequestDTO();
            mockDTO.name = 'Maria';
            mockDTO.surName = 'Gomez';
            mockDTO.email = 'maria@test.com';
            mockDTO.password = 'secreta123';
            mockDTO.imgClients = 'foto.png';
            mockDTO.telephone = '573111234567';
            mockDTO.active = true;
            mockDTO.rolesId = 3;
            mockDTO.typeProyectsId = 7;

            // Act: Ejecutamos el mapper
            const result = mapper.toEntity(mockDTO);

            // Assert: Verificamos que los datos simples se copiaron
            expect(result.name).toBe(mockDTO.name);
            expect(result.surName).toBe(mockDTO.surName);
            expect(result.email).toBe(mockDTO.email);
            expect(result.telephone).toBe(mockDTO.telephone);

            // Verificación crítica 1: El ID principal debe ser 0 al crear una nueva entidad
            expect(result.id).toBe(0);

            // Verificación crítica 2: Debe reconstruir los objetos relacionales para TypeORM
            expect(result.rolesId).toEqual({ id: mockDTO.rolesId });
            expect(result.typeProyectsId).toEqual({ id: mockDTO.typeProyectsId });
        });
    });

    // =================================================================
    // PRUEBA 3: toUpdateEntity (De Entity a Response DTO)
    // =================================================================
    describe('toUpdateEntity', () => {
        it('debería transformar de UsersEntity a UsersResponseDTO trasladando todos los campos y fechas', () => {
            // Arrange: Creamos un Entity completo con fechas (como sale de un findById)
            const dateCreation = new Date('2026-01-01');
            const dateUpdate = new Date('2026-01-02');

            const mockEntity = {
                id: 50,
                name: 'Carlos',
                surName: 'Ruiz',
                email: 'carlos@test.com',
                password: 'hash',
                imgClients: 'img.jpg',
                telephone: '573221234567',
                active: false,
                rolesId: { id: 1 } as RolesEntity,
                typeProyectsId: { id: 2 } as TypeProyectsEntity,
                createdAt: dateCreation,
                updatedAt: dateUpdate,
            } as UsersEntity;

            // Act
            const result = mapper.toUpdateEntity(mockEntity);

            // Assert
            expect(result.id).toBe(mockEntity.id);
            expect(result.name).toBe(mockEntity.name);
            expect(result.surName).toBe(mockEntity.surName);
            expect(result.telephone).toBe(mockEntity.telephone);

            // Relaciones extraídas correctamente
            expect(result.rolesId).toBe(mockEntity.rolesId.id); // Debe ser 1
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id); // Debe ser 2

            // Fechas intactas
            expect(result.createdAt).toBe(mockEntity.createdAt);
            expect(result.updatedAt).toBe(mockEntity.updatedAt);
        });
    });
});