import { Request, Response, NextFunction } from 'express';
import { TYPES } from '@app/dtos/models/types';
import { injectable, inject } from 'inversify';
import { SecurityUtils } from '@core/utils/SecurityUtils';
import { BruteForceUseCase } from '@app/use-cases/BruteForceUseCase';
import { ProcessSecureDataUseCase } from '@app/use-cases/ProcessSecureDataUseCase';
import { WalletUseCase } from '@app/use-cases/WalletUseCase';
import { WalletRequest, WalletRequestSchema } from '@infra/models/WalletRequestSchema';
import { WalletInitRequestSchema, WalletInitRequest } from '@infra/models/WalletInitRequestSchema';

@injectable()
export class WalletController {
    constructor(
        @inject(TYPES.WalletUseCase) private readonly walletUseCase: WalletUseCase,
        @inject(TYPES.SecurityUtils) private securityUtils: SecurityUtils,
        @inject(TYPES.BruteForceUseCase) private readonly bruteForceUseCase: BruteForceUseCase,
        @inject(TYPES.ProcessSecureDataUseCase) private readonly processSecureDataUseCase: ProcessSecureDataUseCase,
    ) { }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = this.processSecureDataUseCase.decrypt(req.body.encryptedKey);
            const decryptedBody = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt);
            const dataValid = WalletInitRequestSchema.parse(decryptedBody);
            const userData: WalletInitRequest = dataValid;
            const data = await this.walletUseCase.save(userData);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, data, 201);
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error); // ¡Crucial para que el GlobalErrorHandler atrape las fallas!
        }
    }

    public createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = this.processSecureDataUseCase.decrypt(req.body.encryptedKey);
            const decryptedBody = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt);
            const dataValid = WalletRequestSchema.parse(decryptedBody);
            const userData: WalletRequest = dataValid;
            const data = await this.walletUseCase.create(userData);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, data, 201);
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error); // ¡Crucial para que el GlobalErrorHandler atrape las fallas!
        }
    }

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