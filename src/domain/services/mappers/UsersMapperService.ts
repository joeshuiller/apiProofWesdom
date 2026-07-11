import { UsersRequestDTO } from "@app/dtos/request/UsersRequestDTO";
import { UsersResponseDTO } from "@app/dtos/response/UsersResponseDTO";
import { RolesEntity } from "@domain/entities/RolesEntity";
import { UsersEntity } from "@domain/entities/UsersEntity";
import { Mapper } from "@domain/services/mappers/Mapper";

export class UsersMapperService implements Mapper<UsersEntity, UsersRequestDTO, UsersResponseDTO> {
    toDTO(entity: UsersEntity): UsersRequestDTO {
        const data: UsersRequestDTO = new UsersRequestDTO();
        data.name = entity.name;
        data.surName = entity.surName;
        data.email = entity.email;
        data.password = entity.password;
        data.imgClients = entity.imgClients;
        data.active = entity.active;
        data.rolesId = entity.rolesId.id;
        return data;
    }
    toEntity(dto: UsersRequestDTO): UsersEntity {
        return {
            name: dto.name,
            surName: dto.surName,
            typeDocumentID: dto.typeDocumentID,
            documentID: dto.documentID,
            email: dto.email,
            password: dto.password,
            imgClients: dto.imgClients,
            telephone: dto.telephone,
            active: dto.active,
            rolesId: { id: dto.rolesId } as RolesEntity,
        }
    }
    toUpdateEntity(entity: UsersEntity): UsersResponseDTO {
        const data: UsersResponseDTO = new UsersResponseDTO();
        data.id = entity.id ?? "0";
        data.name = entity.name;
        data.surName = entity.surName;
        data.typeDocumentID = entity.typeDocumentID;
        data.documentID = entity.documentID;
        data.email = entity.email;
        data.imgClients = entity.imgClients;
        data.password = entity.password;
        data.telephone = entity.telephone;
        data.active = entity.active;
        data.roles = entity.rolesId;
        data.createdAt = entity.createdAt;
        data.updatedAt = entity.updatedAt;
        return data;
    }
}