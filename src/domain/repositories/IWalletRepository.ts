import { WalletRequestDTO } from "@app/dtos/request/WalletRequestDTO";
import { WalletResponseDTO } from "@app/dtos/response/WalletResponseDTO";

export interface IWalletRepository {
    findById(id: string): Promise<WalletResponseDTO | null>;
    saveMultiple(wallets: WalletRequestDTO[], transactionContext?: any): Promise<void>;
    findAll(): Promise<WalletResponseDTO[] | null>
    save(wallet: WalletRequestDTO): Promise<WalletResponseDTO | null>;
}