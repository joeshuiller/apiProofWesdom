export class WalletResponseDTO {
    id!: string;
    usersId!: string;
    availableBalance!: number;
    accountingBalance!: number;
    version!: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}