import { WalletHistoryRequestDTO } from "@app/dtos/request/WalletHistoryRequestDTO";
import { WalletHistoryResponseDTO } from "@app/dtos/response/WalletHistoryResponseDTO";

export interface IWalletHistoryRepository {
    findById(id: string): Promise<WalletHistoryResponseDTO | null>;
    findAll(): Promise<WalletHistoryResponseDTO[] | null>
    save(wallet: WalletHistoryRequestDTO): Promise<WalletHistoryResponseDTO | null>;
    findBysenderId(senderId: string): Promise<WalletHistoryResponseDTO | null>;
    findByReceiverId(receiverId: string): Promise<WalletHistoryResponseDTO | null>;
    update(wallet: WalletHistoryRequestDTO, id: string): Promise<WalletHistoryResponseDTO | null>
}