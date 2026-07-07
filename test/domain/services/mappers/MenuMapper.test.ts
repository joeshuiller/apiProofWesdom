import { MenuMapper } from "@domain/services/mappers/MenuMapper";
import { MenuEntity } from "@domain/entities/MenuEntity";
import { CreateMenuRequestDTO } from "@app/dtos/request/CreateMenuRequestDTO";
import { RolesEntity, TypeProyectsEntity } from "@domain/entities";

describe("MenuMapper", () => {
    let mapper: MenuMapper;

    // Datos de ejemplo para las pruebas
    const mockDate = new Date();

    const mockEntity: MenuEntity = {
        id: 10,
        path: "/dashboard",
        title: "Dashboard",
        type: "link",
        iconType: "home",
        collapse: false,
        children: null,
        imgMenu: "icon.png",
        rolesId: { id: 1 } as RolesEntity,
        typeProyectsId: { id: 2 } as TypeProyectsEntity,
        createdAt: mockDate,
        updatedAt: mockDate
    };

    const mockDTO: CreateMenuRequestDTO = {
        path: "/dashboard",
        title: "Dashboard",
        type: "link",
        iconType: "home",
        collapse: false,
        children: null,
        imgMenu: "icon.png",
        rolesId: 1,
        typeProyectsId: 2
    };

    beforeEach(() => {
        mapper = new MenuMapper();
    });

    describe("toDTO", () => {
        it("should map MenuEntity to CreateMenuRequestDTO correctly", () => {
            const result = mapper.toDTO(mockEntity);

            expect(result).toEqual(mockDTO);
            expect(result.rolesId).toBe(mockEntity.rolesId.id);
            expect(result.typeProyectsId).toBe(mockEntity.typeProyectsId.id);
        });
    });

    describe("toEntity", () => {
        it("should map CreateMenuRequestDTO to MenuEntity correctly", () => {
            const result = mapper.toEntity(mockDTO);

            expect(result.id).toBe(0); // Según tu implementación, toEntity resetea el ID a 0
            expect(result.path).toBe(mockDTO.path);
            expect(result.title).toBe(mockDTO.title);
            expect(result.rolesId.id).toBe(mockDTO.rolesId);
            expect(result.typeProyectsId.id).toBe(mockDTO.typeProyectsId);
            expect(result.rolesId).toHaveProperty('id');
        });
    });

    describe("toUpdateEntity", () => {
        it("should map MenuEntity to CreateMenuResponseDTO with full metadata", () => {
            const result = mapper.toUpdateEntity(mockEntity);

            expect(result.id).toBe(mockEntity.id);
            expect(result.createdAt).toBe(mockDate);
            expect(result.updatedAt).toBe(mockDate);
            expect(result.path).toBe(mockEntity.path);
            expect(result.rolesId).toBe(mockEntity.rolesId.id);
        });
    });
});