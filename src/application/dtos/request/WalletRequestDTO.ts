export class WalletRequestDTO {
    id?: string;
    usersId!: string;
    availableBalance!: number;
    accountingBalance!: number;
    version?: number;
}