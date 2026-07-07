import { WalletHistoryRequestDTO } from "@app/dtos/request/WalletHistoryRequestDTO";
import { WalletHistoryResponseDTO } from "@app/dtos/response/WalletHistoryResponseDTO";
import { UsersEntity } from "@domain/entities";
import { WalletHistoryEntity } from "@domain/entities/WalletHistoryEntity";
import { Mapper } from "./Mapper";
import { TransactionStatus } from "@domain/models/TransactionStatus";


export class WalletHistoryMapperService implements Mapper<WalletHistoryEntity, WalletHistoryRequestDTO, WalletHistoryResponseDTO> {
    toDTO(entity: WalletHistoryEntity): WalletHistoryRequestDTO {
        const status = entity.status as TransactionStatus;
        const data: WalletHistoryRequestDTO = new WalletHistoryRequestDTO();
        data.senderId = entity.senderId.id;
        data.receiverId = entity.receiverId.id;
        data.amount = entity.amount;
        data.status = status;
        return data;
    }
    toEntity(dto: WalletHistoryRequestDTO): WalletHistoryEntity {
        return {
            id: "dd",
            senderId: { id: dto.senderId } as UsersEntity,
            receiverId: { id: dto.receiverId } as UsersEntity,
            amount: dto.amount,
            status: dto.status,
        }
    }
    toUpdateEntity(entity: WalletHistoryEntity): WalletHistoryResponseDTO {
        const data: WalletHistoryResponseDTO = new WalletHistoryResponseDTO();
        const status = entity.status as TransactionStatus;
        data.id = entity.id;
        data.sender = entity.senderId;
        data.receiver = entity.receiverId;
        data.amount = entity.amount;
        data.status = status;
        data.createdAt = entity.createdAt;
        data.updatedAt = entity.updatedAt;
        return data;
    }
}