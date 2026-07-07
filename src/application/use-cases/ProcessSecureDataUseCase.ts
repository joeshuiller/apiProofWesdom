import { inject, injectable } from "inversify";
import { TYPES } from "@app/dtos/models/types";
import { ICryptoRepository } from "@domain/repositories/ICryptoRepository";

@injectable()
export class ProcessSecureDataUseCase {
    constructor(
        @inject(TYPES.ICryptoRepository) private cryptoRepo: ICryptoRepository
    ) { }

    encrypt(data: any, pubKey: string) {
        const jsonString = JSON.stringify(data);
        return this.cryptoRepo.encryptRSA(jsonString, pubKey);
    }

    decrypt(data: any) {
        return this.cryptoRepo.decryptRSA(data);
    }

    decryptJsonComplex(data: any, password: string) {
        return this.cryptoRepo.decryptCryptoJs(data, password);
    }

    encryptJsonComplex(data: any) {
        return this.cryptoRepo.encryptCryptoJs(data);
    }
}