import { UsersWhatsappMapperService } from '@domain/services/mappers/UsersWhatsappMapperService'; // Ajusta la ruta a tu archivo
import { UsersWhatsappEntity } from '@domain/entities/UsersWhatsappEntity';
import { UsersWhatsappRequestDTO } from '@app/dtos/request/UsersWhatsappRequestDTO';
import { UsersWhatsappResponseDTO } from '@app/dtos/response/UsersWhatsappResponseDTO';

describe('UsersWhatsappMapperService', () => {
    let mapper: UsersWhatsappMapperService;

    const mockDate = new Date();

    // --- 1. Datos de prueba: Entidad (Simula lo que devuelve TypeORM) ---
    const mockEntity = {
        id: 1,
        idEntry: 'entry_123',
        contactsName: 'Juan Perez',
        contactsPhoneNumber: '+1234567890',
        displayPhoneNumber: '123-456-7890',
        phoneNumberId: 'phone_123',
        idWhatsapp: 'wa_123',
        active: true,
        typeProyectsId: { id: 10 } as any,
        createdAt: mockDate,
        updatedAt: mockDate,
    } as UsersWhatsappEntity;

    // --- 2. Datos de prueba: Request DTO (Simula la petición del cliente) ---
    const mockRequestDto = {
        idEntry: 'entry_456',
        contactsName: 'Maria Gomez',
        contactsPhoneNumber: '+0987654321',
        displayPhoneNumber: '098-765-4321',
        phoneNumberId: 'phone_456',
        idWhatsapp: 'wa_456',
        active: false,
        typeProyectsId: 20,
    } as UsersWhatsappRequestDTO;

    beforeEach(() => {
        mapper = new UsersWhatsappMapperService();
    });

    describe('toDTO', () => {
        it('debería transformar de Entidad a RequestDTO, extrayendo el ID del proyecto', () => {
            const result = mapper.toDTO(mockEntity);

            // Validamos que se instancie la clase correcta
            expect(result).toBeInstanceOf(UsersWhatsappRequestDTO);

            // Validamos el mapeo de campos directos
            expect(result.idEntry).toBe(mockEntity.idEntry);
            expect(result.contactsName).toBe(mockEntity.contactsName);
            expect(result.contactsPhoneNumber).toBe(mockEntity.contactsPhoneNumber);
            expect(result.displayPhoneNumber).toBe(mockEntity.displayPhoneNumber);
            expect(result.phoneNumberId).toBe(mockEntity.phoneNumberId);
            expect(result.idWhatsapp).toBe(mockEntity.idWhatsapp);
            expect(result.active).toBe(mockEntity.active);

            // Validamos la desanidación de la relación
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
        });
    });

    describe('toEntity', () => {
        it('debería transformar de RequestDTO a Entidad, asignando id: 0 y anidando typeProyectsId', () => {
            const result = mapper.toEntity(mockRequestDto);

            // Validamos que el ID inicialice en 0 para nuevas inserciones
            expect(result.id).toBe(0);

            // Validamos el mapeo de campos directos
            expect(result.idEntry).toBe(mockRequestDto.idEntry);
            expect(result.contactsName).toBe(mockRequestDto.contactsName);
            expect(result.contactsPhoneNumber).toBe(mockRequestDto.contactsPhoneNumber);
            expect(result.displayPhoneNumber).toBe(mockRequestDto.displayPhoneNumber);
            expect(result.phoneNumberId).toBe(mockRequestDto.phoneNumberId);
            expect(result.idWhatsapp).toBe(mockRequestDto.idWhatsapp);
            expect(result.active).toBe(mockRequestDto.active);

            // Validamos la anidación del número en un objeto de entidad relacional
            expect(result.typeProyectsId).toEqual({ id: mockRequestDto.typeProyectsId });
        });
    });

    describe('toUpdateEntity', () => {
        it('debería transformar de Entidad a ResponseDTO, incluyendo el ID y las fechas', () => {
            const result = mapper.toUpdateEntity(mockEntity);

            // Validamos que se instancie la clase correcta
            expect(result).toBeInstanceOf(UsersWhatsappResponseDTO);

            // Validamos el ID base
            expect(result.id).toBe(mockEntity.id);

            // Validamos los demás campos
            expect(result.idEntry).toBe(mockEntity.idEntry);
            expect(result.contactsName).toBe(mockEntity.contactsName);
            expect(result.contactsPhoneNumber).toBe(mockEntity.contactsPhoneNumber);
            expect(result.displayPhoneNumber).toBe(mockEntity.displayPhoneNumber);
            expect(result.phoneNumberId).toBe(mockEntity.phoneNumberId);
            expect(result.idWhatsapp).toBe(mockEntity.idWhatsapp);
            expect(result.active).toBe(mockEntity.active);

            // Validamos la desanidación
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);

            // Validamos que pase las fechas generadas por la base de datos
            expect(result.createdAt).toBe(mockEntity.createdAt);
            expect(result.updatedAt).toBe(mockEntity.updatedAt);
        });
    });
});