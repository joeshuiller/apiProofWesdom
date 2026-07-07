import { Request, Response, NextFunction } from 'express';
import { TYPES } from '@app/dtos/models/types';
import { injectable, inject } from 'inversify';
import { SecurityUtils } from '@core/utils/SecurityUtils';
import { BruteForceUseCase } from '@app/use-cases/BruteForceUseCase';
import { ProcessSecureDataUseCase } from '@app/use-cases/ProcessSecureDataUseCase';
import { WalletHistoryUseCase } from '@app/use-cases/WalletHistoryUseCase';

@injectable()
export class WalletHistoryController {
    constructor(
        @inject(TYPES.WalletUseCase) private readonly walletUseCase: WalletHistoryUseCase,
        @inject(TYPES.SecurityUtils) private securityUtils: SecurityUtils,
        @inject(TYPES.BruteForceUseCase) private readonly bruteForceUseCase: BruteForceUseCase,
        @inject(TYPES.ProcessSecureDataUseCase) private readonly processSecureDataUseCase: ProcessSecureDataUseCase,
    ) { }

    public findAll = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const data = await this.walletUseCase.findAll();
            const encryptedData = this.processSecureDataUseCase.encryptJsonComplex(data);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, encryptedData, 200);
        } catch (error) {
            console.log("error", error);
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }

    public findById = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const data = await this.walletUseCase.findById(req.params.id);
            const encryptedData = this.processSecureDataUseCase.encryptJsonComplex(data);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, encryptedData, 200);
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }
}