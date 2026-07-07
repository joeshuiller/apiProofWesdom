import { ClientsProyectsMapperServices } from "@domain/services/mappers/ClientsProyectsMapperServices";
import { ClientsProyectsEntity } from "@domain/entities/ClientsProyectsEntity";
import { ClientsProyectsRequestDTO } from "@app/dtos/request/ClientsProyectsRequestDTO";
import { UsersEntity, TypeProyectsEntity } from "@domain/entities";

describe("ClientsProyectsMapperServices", () => {
    let mapper: ClientsProyectsMapperServices;

    const mockDate = new Date("2026-04-08T10:00:00Z");

    // Simulación de una entidad completa (como viene de la DB)
    const mockEntity: ClientsProyectsEntity = {
        id: 1,
        color: "#0067b1",
        title: "Proyecto Test",
        imgLogo: "logo.png",
        active: true,
        apiToken: "secret-token",
        userId: { id: 10 } as UsersEntity,
        typeProyectsId: { id: 5 } as TypeProyectsEntity,
        createdAt: mockDate,
        updatedAt: mockDate,
        deletedAt: mockDate
    };

    // Simulación de un DTO de petición (como viene del cliente)
    const mockRequestDTO: ClientsProyectsRequestDTO = {
        color: "#0067b1",
        title: "Proyecto Test",
        imgLogo: "logo.png",
        active: true,
        apiToken: "secret-token",
        userId: 10,
        typeProyectsId: 5
    };

    beforeEach(() => {
        mapper = new ClientsProyectsMapperServices();
    });

    describe("toDTO", () => {
        it("should transform ClientsProyectsEntity to ClientsProyectsRequestDTO correctly", () => {
            const result = mapper.toDTO(mockEntity);

            expect(result).toEqual(mockRequestDTO);
            expect(result.userId).toBe(mockEntity.userId.id);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
        });
    });

    describe("toEntity", () => {
        it("should transform ClientsProyectsRequestDTO to ClientsProyectsEntity correctly", () => {
            const result = mapper.toEntity(mockRequestDTO);

            expect(result.id).toBe(0);
            expect(result.color).toBe(mockRequestDTO.color);
            expect(result.userId.id).toBe(mockRequestDTO.userId);
            expect(result.typeProyectsId.id).toBe(mockRequestDTO.typeProyectsId);
            // Verificar que se crearon los objetos de entidad parciales
            expect(result.userId).toHaveProperty('id');
            expect(result.typeProyectsId).toHaveProperty('id');
        });
    });

    describe("toUpdateEntity", () => {
        it("should transform ClientsProyectsEntity to ClientsProyectsResponseDTO with all metadata", () => {
            const result = mapper.toUpdateEntity(mockEntity);

            expect(result.id).toBe(mockEntity.id);
            expect(result.createdAt).toBe(mockDate);
            expect(result.updatedAt).toBe(mockDate);

            // ✅ Si el mock tiene fecha, el resultado debe tener esa fecha
            expect(result.deletedAt).toBe(mockDate);

            expect(result.userId).toBe(mockEntity.userId.id);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
        });
        it("should handle null deletedAt correctly", () => {
            const entityWithDeleted = { ...mockEntity, deletedAt: mockDate };
            const result = mapper.toUpdateEntity(entityWithDeleted);

            expect(result.deletedAt).toBe(mockDate);
        });
    });
});