import { UsersMessangesTermsAndConditionsMapperService } from '@domain/services/mappers/UsersMessangesTermsAndConditionsMapperService'; // Ajusta la ruta a tu archivo
import { UsersMessangesTermsAndConditionsEntity } from '@domain/entities/UsersMessangesTermsAndConditionsEntity';
import { UsersMessangesTermsAndConditionsRequestDTO } from '@app/dtos/request/UsersMessangesTermsAndConditionsRequestDTO';
import { UsersMessangesTermsAndConditionsResponseDTO } from '@app/dtos/response/UsersMessangesTermsAndConditionsResponseDTO';

describe('UsersMessangesTermsAndConditionsMapperService', () => {
    let mapper: UsersMessangesTermsAndConditionsMapperService;

    const dateNow = new Date();

    // --- 1. Datos de prueba: Entidad (Simula cómo viene de la base de datos) ---
    const mockEntity = {
        id: 1,
        idMessange: 'msg_999',
        fromMessange: '5551234567',
        textBody: 'Acepto los términos y condiciones',
        typeMessange: 'text',
        dateMessange: '2023-11-01',
        payloadMessange: 'payload_data_here',
        textdMessange: 'textd_data_here',
        termConditions: true,
        active: true,
        // Las relaciones vienen como objetos desde TypeORM
        usersWhatsappId: { id: 50 } as any,
        typeProyectsId: { id: 10 } as any,
        createdAt: dateNow,
        updatedAt: dateNow,
    } as UsersMessangesTermsAndConditionsEntity;

    // --- 2. Datos de prueba: Request DTO (Simula cómo viene la petición del cliente) ---
    const mockRequestDto = {
        idMessange: 'msg_999',
        fromMessange: '5551234567',
        textBody: 'Acepto los términos y condiciones',
        typeMessange: 'text',
        dateMessange: '2023-11-01',
        payloadMessange: 'payload_data_here',
        textdMessange: 'textd_data_here',
        termConditions: true,
        active: true,
        // En el DTO, las relaciones son simples números/IDs
        usersWhatsappId: 50,
        typeProyectsId: 10,
    } as UsersMessangesTermsAndConditionsRequestDTO;

    beforeEach(() => {
        // Instanciamos el mapper antes de cada test
        mapper = new UsersMessangesTermsAndConditionsMapperService();
    });

    describe('toDTO', () => {
        it('debería transformar de Entidad a RequestDTO, extrayendo los IDs de las relaciones', () => {
            const result = mapper.toDTO(mockEntity);

            // Verificamos la instancia
            expect(result).toBeInstanceOf(UsersMessangesTermsAndConditionsRequestDTO);

            // Verificamos los campos primitivos
            expect(result.idMessange).toBe(mockEntity.idMessange);
            expect(result.fromMessange).toBe(mockEntity.fromMessange);
            expect(result.textBody).toBe(mockEntity.textBody);
            expect(result.typeMessange).toBe(mockEntity.typeMessange);
            expect(result.dateMessange).toBe(mockEntity.dateMessange);
            expect(result.payloadMessange).toBe(mockEntity.payloadMessange);
            expect(result.textdMessange).toBe(mockEntity.textdMessange);
            expect(result.termConditions).toBe(mockEntity.termConditions);
            expect(result.active).toBe(mockEntity.active);

            // Verificamos la correcta extracción de los objetos anidados
            expect(result.usersWhatsappId).toBe(mockEntity.usersWhatsappId.id);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
        });
    });

    describe('toEntity', () => {
        it('debería transformar de RequestDTO a Entidad, asignando id: 0 y armando las relaciones', () => {
            const result = mapper.toEntity(mockRequestDto);

            // Verificamos que se fuerce el ID a 0 para las nuevas inserciones
            expect(result.id).toBe(0);

            // Verificamos los campos
            expect(result.idMessange).toBe(mockRequestDto.idMessange);
            expect(result.fromMessange).toBe(mockRequestDto.fromMessange);
            expect(result.textBody).toBe(mockRequestDto.textBody);
            expect(result.typeMessange).toBe(mockRequestDto.typeMessange);
            expect(result.dateMessange).toBe(mockRequestDto.dateMessange);
            expect(result.payloadMessange).toBe(mockRequestDto.payloadMessange);
            expect(result.textdMessange).toBe(mockRequestDto.textdMessange);
            expect(result.termConditions).toBe(mockRequestDto.termConditions);
            expect(result.active).toBe(mockRequestDto.active);

            // Verificamos que los números del DTO se conviertan en objetos válidos para TypeORM
            expect(result.usersWhatsappId).toEqual({ id: mockRequestDto.usersWhatsappId });
            expect(result.typeProyectsId).toEqual({ id: mockRequestDto.typeProyectsId });
        });
    });

    describe('toUpdateEntity', () => {
        it('debería transformar de Entidad a ResponseDTO, incluyendo el ID base y fechas', () => {
            const result = mapper.toUpdateEntity(mockEntity);

            // Verificamos la instancia
            expect(result).toBeInstanceOf(UsersMessangesTermsAndConditionsResponseDTO);

            // Verificamos el ID base
            expect(result.id).toBe(mockEntity.id);

            // Verificamos campos
            expect(result.idMessange).toBe(mockEntity.idMessange);
            expect(result.fromMessange).toBe(mockEntity.fromMessange);
            expect(result.textBody).toBe(mockEntity.textBody);
            expect(result.typeMessange).toBe(mockEntity.typeMessange);
            expect(result.dateMessange).toBe(mockEntity.dateMessange);
            expect(result.payloadMessange).toBe(mockEntity.payloadMessange);
            expect(result.textdMessange).toBe(mockEntity.textdMessange);
            expect(result.termConditions).toBe(mockEntity.termConditions);
            expect(result.active).toBe(mockEntity.active);

            // Verificamos las relaciones extraídas
            expect(result.usersWhatsappId).toBe(mockEntity.usersWhatsappId.id);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);

            // Verificamos las fechas del sistema
            expect(result.createdAt).toBe(mockEntity.createdAt);
            expect(result.updatedAt).toBe(mockEntity.updatedAt);
        });
    });
});