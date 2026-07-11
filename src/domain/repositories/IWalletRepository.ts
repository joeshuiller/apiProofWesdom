import { WalletRequestDTO } from "@app/dtos/request/WalletRequestDTO";
import { WalletResponseDTO } from "@app/dtos/response/WalletResponseDTO";

export interface IWalletRepository {
    findById(id: string): Promise<WalletResponseDTO | null>
    findByUserId(id: string): Promise<WalletResponseDTO | null>
    findByIdForUpdate(id: string): Promise<WalletResponseDTO | null>
    findByUserIdForUpdate(userId: string): Promise<WalletResponseDTO | null>
    saveMultiple(wallets: any[]): Promise<void>
    findAll(): Promise<WalletResponseDTO[] | null>
    save(wallet: WalletRequestDTO): Promise<WalletResponseDTO | null>
    update(wallet: WalletRequestDTO, id: string): Promise<WalletResponseDTO | null>
}