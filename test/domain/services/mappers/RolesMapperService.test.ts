import { RolesMapperService } from '@domain/services/mappers/RolesMapperService'; // Ajusta la ruta si es necesario
import { RolesEntity } from '@domain/entities/RolesEntity';
import { RolesRequestDTO } from '@app/dtos/request/RolesRequestDTO';
import { RolesResponseDTO } from '@app/dtos/response/RolesResponseDTO';

describe('RolesMapperService', () => {
    let mapper: RolesMapperService;

    // --- 1. Datos de prueba: Entidad (Simula la BD) ---
    const mockEntity = {
        id: 10,
        name: 'ADMIN',
        active: true,
    } as RolesEntity;

    // --- 2. Datos de prueba: Request DTO (Simula lo que envía el usuario) ---
    const mockRequestDto = {
        name: 'USER',
        active: false,
    } as RolesRequestDTO;

    beforeEach(() => {
        // Instanciamos el mapper real
        mapper = new RolesMapperService();
    });

    describe('toDTO', () => {
        it('debería transformar de RolesEntity a RolesRequestDTO correctamente', () => {
            const result = mapper.toDTO(mockEntity);

            // Verificamos que sea una instancia real de la clase
            expect(result).toBeInstanceOf(RolesRequestDTO);

            // Verificamos el mapeo de campos
            expect(result.name).toBe(mockEntity.name);
            expect(result.active).toBe(mockEntity.active);
        });
    });

    describe('toEntity', () => {
        it('debería transformar de RolesRequestDTO a RolesEntity, asignando id: 0', () => {
            const result = mapper.toEntity(mockRequestDto);

            // Verificamos que asigne el ID 0 por defecto como lo indica tu lógica
            expect(result.id).toBe(0);

            // Verificamos el resto de los campos
            expect(result.name).toBe(mockRequestDto.name);
            expect(result.active).toBe(mockRequestDto.active);
        });
    });

    describe('toUpdateEntity', () => {
        it('debería transformar de RolesEntity a RolesResponseDTO incluyendo el id', () => {
            const result = mapper.toUpdateEntity(mockEntity);

            // Verificamos que sea una instancia real de la clase
            expect(result).toBeInstanceOf(RolesResponseDTO);

            // Verificamos que todos los campos (incluyendo el id) pasen correctamente
            expect(result.id).toBe(mockEntity.id);
            expect(result.name).toBe(mockEntity.name);
            expect(result.active).toBe(mockEntity.active);
        });
    });
});