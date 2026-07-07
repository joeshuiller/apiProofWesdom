import { TYPES } from "@app/dtos/models/types";
import { IPasswordHasher } from "@domain/repositories/IPasswordHasher";
import { inject, injectable } from "inversify";


@injectable()
export class UserPasswordUseCase {
    constructor(
        @inject(TYPES.IPasswordHasher) private hasher: IPasswordHasher, 
    ) {}

    create(dto: string): Promise<string> {
        return this.hasher.hash(dto);
    }
      
    compare(plainText: string, hash: string): Promise<boolean> {
        return this.hasher.compare(plainText, hash);
    }
}