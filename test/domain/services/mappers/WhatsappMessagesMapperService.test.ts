import { WhatsappMessagesMapperService } from '@domain/services/mappers/WhatsappMessagesMapperService'; // Ajusta la ruta
import { UsersMessangesEntity } from '@domain/entities/UsersMessangesEntity';
import { WhatsappMessangesRequestDTO } from '@app/dtos/request/WhatsappMessangesRequestDTO';
import { WhatsappMessangesResponseDTO } from '@app/dtos/response/WhatsappMessangesResponseDTO';

describe('WhatsappMessagesMapperService', () => {
    let mapper: WhatsappMessagesMapperService;

    const dateNow = new Date();

    // --- 1. Datos de prueba: Entidad (Simula lo que viene de la BD) ---
    const mockEntity: UsersMessangesEntity = {
        id: 1,
        idMessange: 'msg_123',
        fromMessange: '5551234567',
        textBody: 'Hola Mundo',
        typeMessange: 'text',
        dateMessange: '2023-10-25',
        sendMessange: true,
        receivedMessange: false,
        readMessage: true,
        inSeen: true,
        active: true,
        typeProyectsId: { id: 10 } as any, // En la BD es una relación (objeto)
        createdAt: dateNow,
        updatedAt: dateNow,
    };

    // --- 2. Datos de prueba: Request DTO (Simula lo que viene del cliente) ---
    const mockRequestDto: WhatsappMessangesRequestDTO = {
        idMessange: 'msg_123',
        fromMessange: '5551234567',
        textBody: 'Hola Mundo',
        typeMessange: 'text',
        dateMessange: '2023-10-25',
        sendMessange: true,
        receivedMessange: false,
        readMessage: true,
        inSeen: true,
        active: true,
        typeProyectsId: 10,
        usersRelationshipsId: 1,
    };

    beforeEach(() => {
        // Instanciamos el mapper real sin ningún mock
        mapper = new WhatsappMessagesMapperService();
    });

    describe('toDTO', () => {
        it('debería transformar de Entity a RequestDTO extrayendo el ID del proyecto', () => {
            const result = mapper.toDTO(mockEntity);

            expect(result).toBeInstanceOf(WhatsappMessangesRequestDTO);
            expect(result.idMessange).toBe(mockEntity.idMessange);
            expect(result.fromMessange).toBe(mockEntity.fromMessange);
            expect(result.textBody).toBe(mockEntity.textBody);
            expect(result.typeMessange).toBe(mockEntity.typeMessange);
            expect(result.dateMessange).toBe(mockEntity.dateMessange);
            expect(result.sendMessange).toBe(mockEntity.sendMessange);
            expect(result.receivedMessange).toBe(mockEntity.receivedMessange);
            expect(result.readMessage).toBe(mockEntity.readMessage);
            expect(result.inSeen).toBe(mockEntity.inSeen);
            expect(result.active).toBe(mockEntity.active);

            // Verificamos la transformación del objeto a número
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
        });
    });

    describe('toEntity', () => {
        it('debería transformar de RequestDTO a Entity, asignando id: 0 y anidando el typeProyectsId', () => {
            const result = mapper.toEntity(mockRequestDto);

            // Verificamos que tu lógica de hardcodear id: 0 funcione
            expect(result.id).toBe(0);
            expect(result.idMessange).toBe(mockRequestDto.idMessange);
            expect(result.fromMessange).toBe(mockRequestDto.fromMessange);
            expect(result.textBody).toBe(mockRequestDto.textBody);
            expect(result.typeMessange).toBe(mockRequestDto.typeMessange);
            expect(result.dateMessange).toBe(mockRequestDto.dateMessange);
            expect(result.sendMessange).toBe(mockRequestDto.sendMessange);
            expect(result.receivedMessange).toBe(mockRequestDto.receivedMessange);
            expect(result.readMessage).toBe(mockRequestDto.readMessage);
            expect(result.inSeen).toBe(mockRequestDto.inSeen);
            expect(result.active).toBe(mockRequestDto.active);

            // Verificamos la transformación del número a un objeto relacional
            expect(result.typeProyectsId).toEqual({ id: mockRequestDto.typeProyectsId });
        });
    });

    describe('toUpdateEntity', () => {
        it('debería transformar de Entity a ResponseDTO transfiriendo las fechas', () => {
            const result = mapper.toUpdateEntity(mockEntity);

            expect(result).toBeInstanceOf(WhatsappMessangesResponseDTO);
            expect(result.id).toBe(mockEntity.id);
            expect(result.idMessange).toBe(mockEntity.idMessange);
            expect(result.fromMessange).toBe(mockEntity.fromMessange);
            expect(result.textBody).toBe(mockEntity.textBody);
            expect(result.typeMessange).toBe(mockEntity.typeMessange);
            expect(result.dateMessange).toBe(mockEntity.dateMessange);
            expect(result.sendMessange).toBe(mockEntity.sendMessange);
            expect(result.active).toBe(mockEntity.active);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);

            // Verificamos que las fechas de TypeORM pasen al DTO de respuesta
            expect(result.createdAt).toBe(mockEntity.createdAt);
            expect(result.updatedAt).toBe(mockEntity.updatedAt);

            // Tu método toUpdateEntity omite algunos campos intencionalmente
            // (receivedMessange, readMessage, inSeen). Comprobamos que no estén.
            expect((result as any).receivedMessange).toBeUndefined();
        });
    });
});