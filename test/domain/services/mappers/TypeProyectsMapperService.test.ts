import { TypeProyectsMapperService } from '@domain/services/mappers/TypeProyectsMapperService';
import { TypeProyectsEntity } from '@domain/entities/TypeProyectsEntity';
import { TypeProyectsRequestDTO } from '@app/dtos/request/TypeProyectsRequestDTO';
import { TypeProyectsResponseDTO } from '@app/dtos/response/TypeProyectsResponseDTO';

describe('TypeProyectsMapperService', () => {
    let mapper: TypeProyectsMapperService;

    const mockDate = new Date();

    // --- 1. Datos de prueba: Entidad (Simula lo que viene de la BD) ---
    const mockEntity = {
        id: 1,
        name: 'Empresa Alpha',
        surName: 'Tech',
        email: 'contacto@alpha.com',
        address: 'Calle Principal 123',
        telephone: '555-1234',
        identification: 'NIT-900123',
        active: true,
        createdAt: mockDate,
        updatedAt: mockDate,
    } as TypeProyectsEntity;

    // --- 2. Datos de prueba: Request DTO (Simula la entrada del cliente) ---
    const mockRequestDto = {
        name: 'Empresa Beta',
        surName: 'Solutions',
        email: 'info@beta.com',
        address: 'Avenida Secundaria 456',
        telephone: '555-5678',
        identification: 'NIT-900456',
        active: false,
    } as TypeProyectsRequestDTO;

    beforeEach(() => {
        // Instanciamos el mapper antes de cada prueba
        mapper = new TypeProyectsMapperService();
    });

    describe('toDTO', () => {
        it('debería transformar de Entidad a RequestDTO correctamente', () => {
            const result = mapper.toDTO(mockEntity);

            // Verificamos la instancia
            expect(result).toBeInstanceOf(TypeProyectsRequestDTO);

            // Verificamos el mapeo exacto de los campos
            expect(result.name).toBe(mockEntity.name);
            expect(result.surName).toBe(mockEntity.surName);
            expect(result.email).toBe(mockEntity.email);
            expect(result.address).toBe(mockEntity.address);
            expect(result.telephone).toBe(mockEntity.telephone);
            expect(result.identification).toBe(mockEntity.identification);
            expect(result.active).toBe(mockEntity.active);
        });
    });

    describe('toEntity', () => {
        it('debería transformar de RequestDTO a Entidad, inicializando el id en 0', () => {
            const result = mapper.toEntity(mockRequestDto);

            // Verificamos la inicialización del ID
            expect(result.id).toBe(0);

            // Verificamos el resto de los campos
            expect(result.name).toBe(mockRequestDto.name);
            expect(result.surName).toBe(mockRequestDto.surName);
            expect(result.address).toBe(mockRequestDto.address);
            expect(result.email).toBe(mockRequestDto.email);
            expect(result.telephone).toBe(mockRequestDto.telephone);
            expect(result.identification).toBe(mockRequestDto.identification);
            expect(result.active).toBe(mockRequestDto.active);
        });
    });

    describe('toUpdateEntity', () => {
        it('debería transformar de Entidad a ResponseDTO, incluyendo el ID y las fechas', () => {
            const result = mapper.toUpdateEntity(mockEntity);

            // Verificamos la instancia
            expect(result).toBeInstanceOf(TypeProyectsResponseDTO);

            // Verificamos el ID
            expect(result.id).toBe(mockEntity.id);

            // Verificamos todos los campos del perfil
            expect(result.name).toBe(mockEntity.name);
            expect(result.surName).toBe(mockEntity.surName);
            expect(result.email).toBe(mockEntity.email);
            expect(result.address).toBe(mockEntity.address);
            expect(result.telephone).toBe(mockEntity.telephone);
            expect(result.identification).toBe(mockEntity.identification);
            expect(result.active).toBe(mockEntity.active);

            // Verificamos las fechas generadas por la base de datos
            expect(result.createdAt).toBe(mockEntity.createdAt);
            expect(result.updatedAt).toBe(mockEntity.updatedAt);
        });
    });
});