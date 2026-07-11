import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { injectable, inject } from 'inversify'; // 👈 Decoradores necesarios
import { TYPES } from '@app/dtos/models/types';
import { UsersUseCase } from '@app/use-cases/UsersUseCase';
import { UserPasswordUseCase } from '@app/use-cases/UserPasswordUseCase';
import { JwtUseCase } from '@app/use-cases/JwtUseCase';
import { LoggerUseCase } from '@app/use-cases/LoggerUseCase';
import { UserRegistration, UserRegistrationSchema } from '@infra/models/UserRegistrationSchema';
import { UserLogin, UserLoginSchema } from '@infra/models/UserLoginSchema';
import { codeLink, codeServices, messageLinks, statusCode } from '@core/utils/RoutersLink';
import { SecurityUtils } from '@core/utils/SecurityUtils';
import { BruteForceUseCase } from '@app/use-cases/BruteForceUseCase';
import { ProcessSecureDataUseCase } from '@app/use-cases/ProcessSecureDataUseCase';
import { UsersResponseDTO } from '@app/dtos/response/UsersResponseDTO';

@injectable() // 👈 1. Clase marcada como inyectable
export class UsersController {

    constructor(
        // 💉 2. Inyección de dependencias mediante el constructor
        @inject(TYPES.UsersUseCase) private readonly usersUseCase: UsersUseCase,
        @inject(TYPES.UserPasswordUseCase) private readonly userPasswordUseCase: UserPasswordUseCase,
        @inject(TYPES.JwtUseCase) private readonly jwtUsers: JwtUseCase,
        @inject(TYPES.LoggerUseCase) private readonly logger: LoggerUseCase,
        @inject(TYPES.SecurityUtils) private readonly securityUtils: SecurityUtils,
        @inject(TYPES.BruteForceUseCase) private readonly bruteForceUseCase: BruteForceUseCase,
        @inject(TYPES.ProcessSecureDataUseCase) private readonly processSecureDataUseCase: ProcessSecureDataUseCase,
    ) { }

    private getTraceId(req: Request): string {
        const headerTraceId = req.headers['x-trace-id'];
        return (Array.isArray(headerTraceId) ? headerTraceId[0] : headerTraceId) || uuidv4();
    }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = JSON.parse(this.processSecureDataUseCase.decrypt(req.body.encryptedKey));
            const decryptedBody = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt.key);
            const dataValid = UserRegistrationSchema.parse(decryptedBody.data);
            const userData: UserRegistration = dataValid
            const traceId = this.getTraceId(req);

            const data = await this.usersUseCase.create(userData);

            if (data) {
                this.logger.info(codeLink.CREATE_VALID, codeServices.users, {
                    data: JSON.stringify(data),
                    traceId: traceId
                });
                const encryptedToken = this.processSecureDataUseCase.encryptJsonComplex(
                    {
                        data: this.processSecureDataUseCase.encryptJsonComplex(data)
                    }
                );
                await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
                return this.securityUtils.sendEncryptedResponse(res, encryptedToken, 200);
            } else {
                await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
                this.logger.error(codeLink.ERROR_CREATE_VALID, codeServices.users, {
                    code: statusCode.error,
                    message: messageLinks.userInvalidCreate,
                    traceId: traceId
                });

                return res.status(401).json({
                    status: statusCode.error,
                    error: {
                        code: codeLink.INVALID_CREATE,
                        message: messageLinks.userInvalidCreate,
                        traceId: traceId
                    }
                });
            }
        } catch (error) {
            next(error);
        }
    }

    public login = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = JSON.parse(this.processSecureDataUseCase.decrypt(req.body.encryptedKey));
            const decryptedBody = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt.key);
            const dataValid = UserLoginSchema.parse(decryptedBody.data);
            const userData: UserLogin = dataValid
            const traceId = this.getTraceId(req);

            const user = await this.usersUseCase.findByEmail(userData.email);


            const handleInvalidCredentials = () => {
                this.logger.error(codeLink.ERROR_CREATE_VALID, codeServices.users, {
                    code: statusCode.error,
                    message: messageLinks.userInvalid,
                    traceId: traceId
                });
                return res.status(401).json({
                    status: statusCode.error,
                    error: {
                        code: codeLink.INVALID_CREDENTIALS,
                        message: messageLinks.userInvalid,
                        traceId: traceId
                    }
                });
            };

            if (!user) return handleInvalidCredentials();

            const isPasswordValid = await this.userPasswordUseCase.compare(userData.password, user.password);
            if (!isPasswordValid) return handleInvalidCredentials();

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...userWithoutPass } = user;

            const token = await this.jwtUsers.generateToken({
                userId: user.id.toString(),
                rolesId: user?.roles?.id ?? 'null',
                email: user.email
            });
            console.log("token", token);
            const encryptedToken = this.processSecureDataUseCase.encryptJsonComplex(
                {
                    authorisation: this.processSecureDataUseCase.encryptJsonComplex(token),
                    expiresIn: 3600,
                    tokenType: "Bearer",
                    users: this.processSecureDataUseCase.encryptJsonComplex(userWithoutPass)
                }
            );
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, encryptedToken, 200);
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }

    public loginClients = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = JSON.parse(this.processSecureDataUseCase.decrypt(req.body.encryptedKey));
            const decryptedBody = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt.key);
            const dataValid = UserLoginSchema.parse(decryptedBody.data);
            const userData: UserLogin = dataValid
            const traceId = this.getTraceId(req);

            const user = await this.usersUseCase.findByEmail(userData.email);


            const handleInvalidCredentials = () => {
                this.logger.error(codeLink.ERROR_CREATE_VALID, codeServices.users, {
                    code: statusCode.error,
                    message: messageLinks.userInvalid,
                    traceId: traceId
                });
                return res.status(401).json({
                    status: statusCode.error,
                    error: {
                        code: codeLink.INVALID_CREDENTIALS,
                        message: messageLinks.userInvalid,
                        traceId: traceId
                    }
                });
            };

            if (!user) return handleInvalidCredentials();

            const isPasswordValid = await this.userPasswordUseCase.compare(userData.password, user.password);
            if (!isPasswordValid) return handleInvalidCredentials();

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password, ...userWithoutPass } = user;

            const token = await this.jwtUsers.generateToken({
                userId: user.id.toString(),
                rolesId: user?.roles?.id ?? 'null',
                email: user.email
            });
            const encryptedToken = this.processSecureDataUseCase.encryptJsonComplex(
                {
                    authorisation: this.processSecureDataUseCase.encryptJsonComplex(token),
                    expiresIn: 3600,
                    tokenType: "Bearer",
                    users: this.processSecureDataUseCase.encryptJsonComplex(userWithoutPass),
                }
            );
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, encryptedToken, 200);;
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }

    public logoutJwt = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            return res.status(500).json({
                message: "Internal Server Error!",
                error: []
            });
        } catch (error) {
            next(error);
        }
    }

    public findAll = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = JSON.parse(this.processSecureDataUseCase.decrypt(req.body.encryptedKey));
            const decryptedBody = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt.key);
            const data: UsersResponseDTO[] | null = await this.usersUseCase.findAll(decryptedBody.data.rolesId);
            const usuariosSinPassword = data?.map((user) => {
                const { password, ...userWithoutPass } = user;
                return userWithoutPass;
            });
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, this.processSecureDataUseCase.encryptJsonComplex(usuariosSinPassword), 200);
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }

    public findById = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const data = await this.usersUseCase.findById(req.params.id);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, data, 200);
        } catch (error) {
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }

    // ==========================================
    // D - DELETE
    // ==========================================
    public delete = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            await this.usersUseCase.delete(req.params.id);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, {
                success: true,
                message: 'Usuario eliminado correctamente'
            }, 200);
        } catch (error: any) {
            if (error.message.includes('no fue encontrado')) error.status = 404;
            else error.status = 400;
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }

    // ==========================================
    // U - UPDATE
    // ==========================================
    public update = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
        try {
            const tokenDecrypt = JSON.parse(this.processSecureDataUseCase.decrypt(req.body.encryptedKey));
            const decryptedBody: any = this.processSecureDataUseCase.decryptJsonComplex(req.body.encryptedData, tokenDecrypt.key);
            const dataValid = UserRegistrationSchema.parse(decryptedBody.data);
            const userData: UserRegistration = dataValid;
            const data = await this.usersUseCase.update(req.params.id, userData);
            await this.bruteForceUseCase.clearAttempts(req.socket.remoteAddress!);
            return this.securityUtils.sendEncryptedResponse(res, data, 200);
        } catch (error: any) {
            if (error.message.includes('no fue encontrado')) error.status = 404;
            else error.status = 400;
            await this.bruteForceUseCase.registerFailedAttempt(req.socket.remoteAddress!);
            next(error);
        }
    }
}