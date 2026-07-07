import { WebHookMapperService } from '@domain/services/mappers/WebHookMapperService'; // Ajusta la ruta a tu archivo real
import { WebHooksEntity } from '@domain/entities/WebHooksEntity';
import { WebHookRequestDTO } from '@app/dtos/request/WebHookRequestDTO';
import { WebHookResponseDTO } from '@app/dtos/response/WebHookResponseDTO';

describe('WebHookMapperService', () => {
    let mapper: WebHookMapperService;

    const mockDate = new Date();

    // --- 1. Datos de prueba: Entidad (Simula lo que viene de la BD) ---
    const mockEntity = {
        id: 100,
        token: 'super-secret-token',
        url: 'https://midominio.com/webhook',
        accessToken: 'access-123',
        urlWhatsapp: 'https://api.whatsapp.com',
        version: 'v16.0',
        idWhatsapp: 'wa_123',
        active: true,
        typeProyectsId: { id: 10 } as any, // Objeto anidado de la relación
        createdAt: mockDate,
        updatedAt: mockDate,
    } as WebHooksEntity;

    // --- 2. Datos de prueba: Request DTO (Simula la entrada del cliente) ---
    const mockRequestDto = {
        token: 'new-token',
        url: 'https://nuevodominio.com/webhook',
        accessToken: 'new-access-123',
        urlWhatsapp: 'https://api.whatsapp.com',
        version: 'v17.0',
        idWhatsapp: 'wa_456',
        active: false,
        typeProyectsId: 5, // Número simple
    } as WebHookRequestDTO;

    beforeEach(() => {
        // Instanciamos el mapper sin ningún mock
        mapper = new WebHookMapperService();
    });

    describe('toDTO', () => {
        it('debería transformar de Entidad a RequestDTO', () => {
            const result = mapper.toDTO(mockEntity);

            // Verificamos la instancia
            expect(result).toBeInstanceOf(WebHookRequestDTO);

            // Verificamos los campos primitivos
            expect(result.token).toBe(mockEntity.token);
            expect(result.url).toBe(mockEntity.url);
            expect(result.accessToken).toBe(mockEntity.accessToken);
            expect(result.urlWhatsapp).toBe(mockEntity.urlWhatsapp);
            expect(result.version).toBe(mockEntity.version);
            expect(result.idWhatsapp).toBe(mockEntity.idWhatsapp);
            expect(result.active).toBe(mockEntity.active);

            // Validamos la lógica actual de tu código: data.typeProyectsId = entity.id
            expect(result.typeProyectsId).toBe(mockEntity.id);
        });
    });

    describe('toEntity', () => {
        it('debería transformar de RequestDTO a Entidad, asignando id: 0 y anidando la relación', () => {
            const result = mapper.toEntity(mockRequestDto);

            // Verificamos que el ID se inicializa en 0
            expect(result.id).toBe(0);

            // Verificamos los campos primitivos
            expect(result.token).toBe(mockRequestDto.token);
            expect(result.url).toBe(mockRequestDto.url);
            expect(result.accessToken).toBe(mockRequestDto.accessToken);
            expect(result.urlWhatsapp).toBe(mockRequestDto.urlWhatsapp);
            expect(result.version).toBe(mockRequestDto.version);
            expect(result.idWhatsapp).toBe(mockRequestDto.idWhatsapp);
            expect(result.active).toBe(mockRequestDto.active);

            // Verificamos la creación del objeto relacional para TypeORM
            expect(result.typeProyectsId).toEqual({ id: mockRequestDto.typeProyectsId });
        });
    });

    describe('toUpdateEntity', () => {
        it('debería transformar de Entidad a ResponseDTO, incluyendo el ID, la relación y fechas', () => {
            const result = mapper.toUpdateEntity(mockEntity);

            // Verificamos la instancia
            expect(result).toBeInstanceOf(WebHookResponseDTO);

            // Verificamos el ID
            expect(result.id).toBe(mockEntity.id);

            // Verificamos los campos primitivos
            expect(result.token).toBe(mockEntity.token);
            expect(result.url).toBe(mockEntity.url);
            expect(result.accessToken).toBe(mockEntity.accessToken);
            expect(result.urlWhatsapp).toBe(mockEntity.urlWhatsapp);
            expect(result.version).toBe(mockEntity.version);
            expect(result.idWhatsapp).toBe(mockEntity.idWhatsapp);
            expect(result.active).toBe(mockEntity.active);

            // Verificamos que extrae correctamente el ID de la relación
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);

            // Verificamos que transfiere las fechas correctamente
            expect(result.createdAt).toBe(mockEntity.createdAt);
            expect(result.updatedAt).toBe(mockEntity.updatedAt);
        });
    });
});