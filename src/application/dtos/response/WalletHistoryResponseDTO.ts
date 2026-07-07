import { TransactionStatus } from "@domain/models/TransactionStatus";
import { UsersDTO } from "../request/UsersDTO";

export class WalletHistoryResponseDTO {
    id!: string;
    sender?: UsersDTO;
    receiver?: UsersDTO;
    amount!: number;
    status!: TransactionStatus;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}