import { UsersDTO } from "../request/UsersDTO";

export class WalletResponseDTO {
    id!: string;
    users!: UsersDTO;
    availableBalance!: number;
    accountingBalance!: number;
    version!: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}