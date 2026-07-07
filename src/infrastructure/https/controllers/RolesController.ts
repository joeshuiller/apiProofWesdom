import { Request, Response, NextFunction } from 'express';
import { TYPES } from '@app/dtos/models/types';
import { RolesUseCase } from '@app/use-cases/RolesUseCase';
import { RolRegistration, RolRegistrationSchema } from '@infra/models/RolRegistrationSchema';
import { injectable, inject } from 'inversify';
import { SecurityUtils } from '@core/utils/SecurityUtils';
import { BruteForceUseCase } from '@app/use-cases/BruteForceUseCase';
import { ProcessSecureDataUseCase } from '@app/use-cases/ProcessSecureDataUseCase';

@injectable()
export class RolesController {
    constructor(
        @inject(TYPES.RolesUseCase) private readonly rolesUseCase: RolesUseCase,
        @inject(TYPES.SecurityUtils) private securityUtils: SecurityUtils,
        @inject(TYPES.BruteForceUseCase) private readonly bruteForceUseCase: BruteForceUseCase,
        @inject(TYPES.ProcessSecureDataUseCase) private readonly processSecureDataUseCase: ProcessSecureDataUseCase,
    ) { }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = this.processSecureDataUseCase.decrypt(req.body.encryptedKey);
            const decryptedBody = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt);
            const dataValid = RolRegistrationSchema.parse(decryptedBody);
            const userData: RolRegistration = dataValid;
            const data = await this.rolesUseCase.create(userData);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, data, 201);
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error); // ¡Crucial para que el GlobalErrorHandler atrape las fallas!
        }
    }

    public findAllRoles = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const data = await this.rolesUseCase.findByAll();
            const encryptedData = this.processSecureDataUseCase.encryptJsonComplex(data);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, encryptedData, 200);
        } catch (error) {
            console.log("error", error);
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }

    public findByIdRoles = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const data = await this.rolesUseCase.findById(req.params.id);
            const encryptedData = this.processSecureDataUseCase.encryptJsonComplex(data);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, encryptedData, 200);
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }
}