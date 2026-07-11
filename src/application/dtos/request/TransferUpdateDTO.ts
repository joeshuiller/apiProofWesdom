import { TransactionStatus } from "@domain/models/TransactionStatus";

export class TransferUpdateDTO {
    senderId!: string;
    receiverId!: string;
    amount!: number;
    status!: TransactionStatus;
}