import { Request, Response, NextFunction } from 'express';
import { TYPES } from '@app/dtos/models/types';
import { injectable, inject } from 'inversify';
import { SecurityUtils } from '@core/utils/SecurityUtils';
import { BruteForceUseCase } from '@app/use-cases/BruteForceUseCase';
import { ProcessSecureDataUseCase } from '@app/use-cases/ProcessSecureDataUseCase';
import { WalletHistoryUseCase } from '@app/use-cases/WalletHistoryUseCase';
import { WalletHistoryRequest, WalletHistoryRequestSchema } from '@infra/models/WalletHistoryRequestSchema';
import { TransactionStatus } from '@domain/models/TransactionStatus';
import { TransferUpdateDTO } from '@app/dtos/request/TransferUpdateDTO';

@injectable()
export class WalletHistoryController {
    constructor(
        @inject(TYPES.WalletHistoryUseCase) private readonly walletUseCase: WalletHistoryUseCase,
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

    public updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = JSON.parse(this.processSecureDataUseCase.decrypt(req.body.encryptedKey));
            const decryptedBody = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt.key);
            const dataValid = WalletHistoryRequestSchema.parse(decryptedBody.data);
            const userData: WalletHistoryRequest = dataValid;
            const dataEnd: TransferUpdateDTO = {
                status: userData.status as TransactionStatus,
                amount: userData.amount,
                senderId: userData.senderId,
                receiverId: userData.receiverId
            }
            const data = await this.walletUseCase.updateStatus(dataEnd, req.params.id);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, this.processSecureDataUseCase.encryptJsonComplex(data), 200);
        } catch (error) {
            console.log("error", error);
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }
}