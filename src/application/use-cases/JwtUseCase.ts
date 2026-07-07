import { TYPES } from "@app/dtos/models/types";
import { IAuthService } from "@domain/repositories/IAuthService";
import { AuthPayload, IRefreshResult } from "@domain/services/JwtAuthService";
import { inject, injectable } from "inversify";

@injectable()
export class JwtUseCase {

    constructor(
        @inject(TYPES.IAuthService) private authService: IAuthService,
    ) { }

    async generateToken(payload: AuthPayload): Promise<string> {
        return await this.authService.generateToken(payload);
    }
    async verifyToken(token: string): Promise<AuthPayload> {
        return await this.authService.verifyToken(token);
    }
    async rotateRefreshToken(encryptedRefreshToken: string): Promise<IRefreshResult> {
        return await this.authService.rotateRefreshToken(encryptedRefreshToken);
    }
    async invalidateToken(token: string): Promise<void> {
        await this.authService.invalidateToken(token);
    }
    async generateRefreshToken(payload: AuthPayload): Promise<string> {
        return await this.authService.generateRefreshToken(payload);
    }


}