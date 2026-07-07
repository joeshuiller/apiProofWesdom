import "reflect-metadata";
import { DinamicCryptosMapperService } from "@domain/services/mappers/DinamicCryptosMapperService";
import { DynamicCryptosEntity } from "@domain/entities/DinamicCryptosEntity";
import { CreateDynamicCryptoRequestDTO } from "@app/dtos/request/CreateDynamicCryptoRequestDTO";
import { TypeProyectsEntity } from "@domain/entities/TypeProyectsEntity";
import { UsersEntity } from "@domain/entities/UsersEntity";

describe("DinamicCryptosMapperService", () => {
    let service: DinamicCryptosMapperService;

    // Mock de fechas fijas para consistencia en los tests
    const now = new Date();

    // Objeto Entidad de ejemplo para pruebas
    const mockEntity: DynamicCryptosEntity = {
        id: 1,
        privateKey: "private_rsa_key_example",
        publicKey: "public_rsa_key_example",
        privateRecaptcha: "recaptcha_secret",
        publicRecaptcha: "recaptcha_site",
        pgtmId: "GTM-123",
        pgtmIdTag: "TAG-456",
        pfacebookPixel: "PIXEL-789",
        active: true,
        typeProyectsId: { id: 10 } as TypeProyectsEntity,
        usersId: { id: 5 } as UsersEntity,
        createdAt: now,
        updatedAt: now,
        deletedAt: null as any
    } as any; // Usamos cast para manejar campos de auditoría de TypeORM en el mock

    // Objeto DTO de ejemplo para pruebas
    const mockRequestDto: CreateDynamicCryptoRequestDTO = {
        privateKey: "new_private_key",
        publicKey: "new_public_key",
        privateRecaptcha: "new_recaptcha_priv",
        publicRecaptcha: "new_recaptcha_pub",
        pgtmId: "GTM-NEW",
        pgtmIdTag: "TAG-NEW",
        pfacebookPixel: "PIXEL-NEW",
        typeProyectsId: 10,
        usersId: 5,
        active: true
    };

    beforeEach(() => {
        service = new DinamicCryptosMapperService();
    });

    describe("toDTO", () => {
        it("debe transformar una entidad en un DTO de solicitud correctamente", () => {
            const result = service.toDTO(mockEntity);

            expect(result.privateKey).toBe(mockEntity.privateKey);
            expect(result.publicKey).toBe(mockEntity.publicKey);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
            expect(result.usersId).toBe(mockEntity.usersId.id);
            expect(result).not.toHaveProperty('id');
        });
    });

    describe("toEntity", () => {
        it("debe transformar un DTO de solicitud en una entidad con ID 0", () => {
            const result = service.toEntity(mockRequestDto);

            expect(result.id).toBe(0);
            expect(result.privateKey).toBe(mockRequestDto.privateKey);
            expect(result.active).toBe(mockRequestDto.active);

            // Verificamos el mapeo de objetos de relación
            expect(result.typeProyectsId).toEqual({ id: mockRequestDto.typeProyectsId });
            expect(result.usersId).toEqual({ id: mockRequestDto.usersId });
        });
    });

    describe("toUpdateEntity (Response Mapping)", () => {
        it("debe transformar una entidad en un DTO de respuesta completo (incluyendo auditoría)", () => {
            const result = service.toUpdateEntity(mockEntity);

            expect(result.id).toBe(mockEntity.id);
            expect(result.active).toBe(mockEntity.active);
            expect(result.createdAt).toEqual(mockEntity.createdAt);
            expect(result.updatedAt).toEqual(mockEntity.updatedAt);
            expect(result.deletedAt).toBe(mockEntity.deletedAt);

            // Verificamos IDs de relación
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
            expect(result.usersId).toBe(mockEntity.usersId.id);
        });

        it("debe mantener la integridad de las llaves RSA en el DTO de respuesta", () => {
            const result = service.toUpdateEntity(mockEntity);
            expect(result.privateKey).toBe(mockEntity.privateKey);
            expect(result.publicKey).toBe(mockEntity.publicKey);
        });
    });
});