import { Mapper } from "./Mapper";
import { UsersEntity, WalletEntity } from "@domain/entities";
import { WalletRequestDTO } from "@app/dtos/request/WalletRequestDTO";
import { WalletResponseDTO } from "@app/dtos/response/WalletResponseDTO";


export class WalletMapperService implements Mapper<WalletEntity, WalletRequestDTO, WalletResponseDTO> {
    toDTO(entity: WalletEntity): WalletRequestDTO {
        const data: WalletRequestDTO = new WalletRequestDTO();
        data.id = entity.id;
        data.usersId = entity.usersId.id;
        data.availableBalance = entity.availableBalance;
        data.accountingBalance = entity.accountingBalance;
        data.version = entity.version;
        return data;
    }
    toEntity(dto: WalletRequestDTO): WalletEntity {
        return {
            id: dto.id ?? '',
            usersId: { id: dto.usersId } as UsersEntity,
            availableBalance: dto.availableBalance,
            accountingBalance: dto.accountingBalance,
            version: dto.version ?? 0
        }
    }
    toUpdateEntity(entity: WalletEntity): WalletResponseDTO {
        const data: WalletResponseDTO = new WalletResponseDTO();
        data.id = entity.id;
        data.usersId = entity.usersId.id;
        data.availableBalance = entity.availableBalance;
        data.accountingBalance = entity.accountingBalance;
        data.version = entity.version;
        return data;
    }
}