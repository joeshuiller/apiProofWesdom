import { DomainError } from "../DomainError";

export class InsufficientFundsError extends DomainError {
    constructor(walletNumber: string) {
        super(`La cartera ${walletNumber} no tiene fondos suficientes para realizar la transacción.`);
    }
}