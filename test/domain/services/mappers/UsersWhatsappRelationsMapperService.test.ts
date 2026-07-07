import { UsersWhatsappRelationsMapperService } from '@domain/services/mappers/UsersWhatsappRelationsMapperService'; // Ajusta la ruta si es necesario
import { UsersRelationshipsEntity } from '@domain/entities/UsersRelationshipsEntity';
import { UsersRelationshipsRequestDTO } from '@app/dtos/request/UsersRelationshipsRequestDTO';
import { UsersRelationshipsResponseDTO } from '@app/dtos/response/UsersRelationshipsResponseDTO';

describe('UsersWhatsappRelationsMapperService', () => {
    let mapper: UsersWhatsappRelationsMapperService;

    const mockDate = new Date();

    // --- 1. Datos de prueba: Entidad (Simula lo que devuelve TypeORM) ---
    const mockEntity = {
        id: 1,
        active: true,
        // Relaciones como objetos anidados
        usersId: { id: 10 } as any,
        usersWhatsappId: { id: 20 } as any,
        typeProyectsId: { id: 30 } as any,
        campaignsId: { id: 40 } as any,
        createdAt: mockDate,
        updatedAt: mockDate,
    } as UsersRelationshipsEntity;

    // --- 2. Datos de prueba: Request DTO (Simula la petición del cliente) ---
    const mockRequestDto = {
        active: false,
        // Relaciones como números simples
        usersId: 100,
        usersWhatsappId: 200,
        typeProyectsId: 300,
        campaignsId: 400,
    } as UsersRelationshipsRequestDTO;

    beforeEach(() => {
        mapper = new UsersWhatsappRelationsMapperService();
    });

    describe('toDTO', () => {
        it('debería transformar de Entidad a RequestDTO, extrayendo los IDs de las tres relaciones', () => {
            const result = mapper.toDTO(mockEntity);

            // Validamos la instancia
            expect(result).toBeInstanceOf(UsersRelationshipsRequestDTO);

            // Validamos los campos simples
            expect(result.active).toBe(mockEntity.active);

            // Validamos la desanidación de las tres relaciones
            expect(result.usersId).toBe(mockEntity.usersId.id);
            expect(result.usersWhatsappId).toBe(mockEntity.usersWhatsappId.id);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
        });
    });

    describe('toEntity', () => {
        it('debería transformar de RequestDTO a Entidad, asignando id: 0 y anidando las tres relaciones', () => {
            const result = mapper.toEntity(mockRequestDto);

            // Validamos que el ID inicialice en 0
            expect(result.id).toBe(0);

            // Validamos los campos simples
            expect(result.active).toBe(mockRequestDto.active);

            // Validamos la anidación (transformar números a objetos referenciales)
            expect(result.usersId).toEqual({ id: mockRequestDto.usersId });
            expect(result.usersWhatsappId).toEqual({ id: mockRequestDto.usersWhatsappId });
            expect(result.typeProyectsId).toEqual({ id: mockRequestDto.typeProyectsId });
        });
    });

    describe('toUpdateEntity', () => {
        it('debería transformar de Entidad a ResponseDTO, incluyendo el ID, las fechas y desanidando relaciones', () => {
            const result = mapper.toUpdateEntity(mockEntity);

            // Validamos la instancia
            expect(result).toBeInstanceOf(UsersRelationshipsResponseDTO);

            // Validamos el ID y los campos simples
            expect(result.id).toBe(mockEntity.id);
            expect(result.active).toBe(mockEntity.active);

            // Validamos la desanidación de las relaciones
            expect(result.usersId).toBe(mockEntity.usersId.id);
            expect(result.usersWhatsappId).toBe(mockEntity.usersWhatsappId.id);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);

            // Validamos que pase las fechas generadas por la base de datos
            expect(result.createdAt).toBe(mockEntity.createdAt);
            expect(result.updatedAt).toBe(mockEntity.updatedAt);
        });
    });
});