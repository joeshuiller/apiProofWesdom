import { TransactionStatus } from "@domain/models/TransactionStatus";

export class WalletHistoryRequestDTO {
    senderId!: string;
    receiverId!: string;
    amount!: number;
    status!: TransactionStatus;
}