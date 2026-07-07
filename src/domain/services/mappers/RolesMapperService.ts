import { RolesRequestDTO } from "@app/dtos/request/RolesRequestDTO";
import { RolesResponseDTO } from "@app/dtos/response/RolesResponseDTO";
import { RolesEntity } from "@domain/entities/RolesEntity";
import { Mapper } from "./Mapper";


export class RolesMapperService implements Mapper<RolesEntity, RolesRequestDTO, RolesResponseDTO> {
    toDTO(entity: RolesEntity): RolesRequestDTO {
        const data: RolesRequestDTO = new RolesRequestDTO();
        data.name = entity.name;
        data.active = entity.active;
        return data;
    }
    toEntity(dto: RolesRequestDTO): RolesEntity {
        return {
            id: "ddd",
            name: dto.name,
            active: dto.active,
        }
    }
    toUpdateEntity(entity: RolesEntity): RolesResponseDTO {
        const data: RolesResponseDTO = new RolesResponseDTO();
        data.id = entity.id;
        data.name = entity.name;
        data.active = entity.active;
        return data;
    }
}