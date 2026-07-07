import { CampaignsMapperService } from '@domain/services/mappers/CampaignsMapperService'; // Ajusta la ruta a tu mapper
import { CampaignsRequestDTO } from '@app/dtos/request/CampaignsRequestDTO';
import { CampaignsEntity } from '@domain/entities/CampaignsEntity';
import { TypeProyectsEntity } from '@domain/entities/TypeProyectsEntity';

describe('CampaignsMapperService', () => {
    let mapper: CampaignsMapperService;

    // Fechas de prueba fijas para que las aserciones sean exactas
    const mockDate = new Date('2026-01-01T00:00:00Z');

    beforeEach(() => {
        mapper = new CampaignsMapperService();
    });

    describe('toEntity()', () => {
        it('debería mapear correctamente de CampaignsRequestDTO a CampaignsEntity', () => {
            // Arrange: Preparamos el DTO de entrada
            const requestDto = new CampaignsRequestDTO();
            requestDto.name = 'Campaña de Verano';
            requestDto.description = 'Descuentos del 50%';
            requestDto.active = true;
            requestDto.typeProyectsId = 10;

            // Act: Ejecutamos el mapper
            const result = mapper.toEntity(requestDto);

            // Assert: Validamos que la entidad resultante tenga los datos correctos
            expect(result).toBeInstanceOf(CampaignsEntity);
            expect(result.name).toBe('Campaña de Verano');
            expect(result.description).toBe('Descuentos del 50%');
            expect(result.active).toBe(true);

            // Validamos la transformación especial del ID a un objeto TypeProyectsEntity
            expect(result.typeProyectsId).toEqual({ id: 10 });
        });
    });

    describe('toUpdateEntity()', () => {
        it('debería mapear correctamente de CampaignsEntity a CampaignsResponseDTO', () => {
            // Arrange: Preparamos la Entidad de entrada
            const entity = new CampaignsEntity();
            entity.id = 5;
            entity.name = 'Campaña de Invierno';
            entity.description = 'Liquidación total';
            entity.active = false;
            entity.typeProyectsId = { id: 20 } as TypeProyectsEntity;
            entity.createdAt = mockDate;
            entity.updatedAt = mockDate;

            // Act: Ejecutamos el mapper
            const result = mapper.toUpdateEntity(entity);

            // Assert: Validamos que el DTO de respuesta extraiga los datos correctamente
            expect(result.id).toBe(5);
            expect(result.name).toBe('Campaña de Invierno');
            expect(result.description).toBe('Liquidación total');
            expect(result.active).toBe(false);

            // Validamos que haya "desempaquetado" el ID del proyecto
            expect(result.typeProyectsId).toBe(20);

            expect(result.createdAt).toEqual(mockDate);
            expect(result.updatedAt).toEqual(mockDate);
        });
    });

    describe('toDTO()', () => {
        it('debería mapear correctamente de CampaignsEntity a CampaignsRequestDTO', () => {
            // Arrange: Preparamos la Entidad de entrada
            const entity = new CampaignsEntity();
            entity.name = 'Campaña Flash';
            entity.description = 'Solo por 24 horas';
            entity.active = true;
            entity.typeProyectsId = { id: 30 } as TypeProyectsEntity;

            // Act: Ejecutamos el mapper
            const result = mapper.toDTO(entity);

            // Assert: Validamos que retorne un DTO de Request válido
            expect(result).toBeInstanceOf(CampaignsRequestDTO);
            expect(result.name).toBe('Campaña Flash');
            expect(result.description).toBe('Solo por 24 horas');
            expect(result.active).toBe(true);

            // Validamos la extracción del ID
            expect(result.typeProyectsId).toBe(30);
        });
    });
});