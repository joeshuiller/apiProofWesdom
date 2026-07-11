import "reflect-metadata";

import { Container, ContainerModule } from "inversify";
import { TYPES } from "@app/dtos/models/types";

// --- CASOS DE USO ---
import { JwtUseCase } from "@app/use-cases/JwtUseCase";
import { LoggerUseCase } from "@app/use-cases/LoggerUseCase";
import { RolesUseCase } from "@app/use-cases/RolesUseCase";
import { UserPasswordUseCase } from "@app/use-cases/UserPasswordUseCase";
import { UsersUseCase } from "@app/use-cases/UsersUseCase";
import { BruteForceUseCase } from "@app/use-cases/BruteForceUseCase";
import { ProcessSecureDataUseCase } from "@app/use-cases/ProcessSecureDataUseCase";
import { WalletUseCase } from "@app/use-cases/WalletUseCase";
import { WalletHistoryUseCase } from "@app/use-cases/WalletHistoryUseCase";

// --- INTERFACES (Dominio) ---
import { IAuthService } from "@domain/repositories/IAuthService";
import { ILoggerRepository } from "@domain/repositories/ILoggerRepository";
import { IPasswordHasher } from "@domain/repositories/IPasswordHasher";
import { IRolesRepository } from "@domain/repositories/IRolesRepository";
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { IBruteForceRepository } from "@domain/repositories/IBruteForceRepository";
import { ICryptoRepository } from "@domain/repositories/ICryptoRepository";
import { IWalletRepository } from "@domain/repositories/IWalletRepository";
import { IWalletHistoryRepository } from "@domain/repositories/IWalletHistoryRepository";

// --- IMPLEMENTACIONES (Infraestructura) ---
import { Argon2Hasher } from "@domain/services/Argon2Hasher";
import { JwtAuthService } from "@domain/services/JwtAuthService";
import { LoggerRepository } from "@domain/services/LoggerRepository";
import { BruteForceRepository } from "@domain/services/BruteForceRepository";
import { RSACryptoRepository } from "@domain/services/RSACryptoRepository";
import { RolesRepository } from "@domain/services/RolesRepository";
import { UsersRepository } from "@domain/services/UsersRepository";
import { WalletHistoryRepository } from "@domain/services/WalletHistoryRepository";
import { WalletRepository } from "@domain/services/WalletRepository";

// --- CONTROLADORES HTTP ---
import { RolesController } from "@infra/https/controllers/RolesController";
import { UsersController } from "@infra/https/controllers/UsersController";
import { WalletController } from "@infra/https/controllers/WalletController";
import { WalletHistoryController } from "@infra/https/controllers/WalletHistoryController";

// --- SERVIDOR, RUTAS Y ADAPTADORES ---
import { ServerExpress } from "@infra/config/ExpressServer";
import { Routes } from "@infra/https/routes/Routes";
import { UsersRoutes } from "@infra/https/routes/public/UsersRoute";
import { RolesRoutes } from "@infra/https/routes/private/RolesRoute";
import { WalletRoutes } from "@infra/https/routes/private/WalletRoutes";
import { WalletHistoryRoutes } from "@infra/https/routes/private/WalletHistoryRoutes";

// --- MIDDLEWARES ---
import { BruteForceMiddleware } from "@infra/https/middlewares/bruteForceMiddleware";
import { GlobalErrorHandler } from "@infra/https/middlewares/GlobalErrorHandler";
import { AuthMiddleware } from "@infra/https/middlewares/AuthMiddleware";
import { IpRestrictionMiddleware } from "@infra/https/middlewares/IpRestrictionMiddleware";
import { ValidateMiddleware } from "@infra/https/middlewares/ValidateData";

// --- CORE / UTILS ---
import { UtilsData } from "@core/utils/UtilsData";
import { SecurityUtils } from "@core/utils/SecurityUtils";
import { CodeGeneratorService } from "@core/utils/CodeGeneratorService";

// --- SISTEMA TRANSACCIONAL (Senior Context-Aware) ---
import { TransactionContext } from "@domain/services/transaction/TransactionContext";
import { UnitOfWork } from "@domain/services/transaction/UnitOfWork";
import { DataSource } from "typeorm";
import { AppDataSource } from "@infra/database/dataSource";

// =========================================================================
// 0. MÓDULO DE BASE DE DATOS Y TRANSACCIONES (ACID)
// =========================================================================
export const dataSourceModule = new ContainerModule(({ bind }) => {
    // Registramos la constante global de TypeORM
    bind<DataSource>(TYPES.DataSource).toConstantValue(AppDataSource);

    // 🌟 Vinculamos los Tokens de Inversify con sus clases concretas correspondientes
    bind<TransactionContext>(TYPES.TransactionContext).to(TransactionContext).inSingletonScope();
    bind<UnitOfWork>(TYPES.UnitOfWork).to(UnitOfWork).inSingletonScope();
});

// =========================================================================
// 1. MÓDULO DE REPOSITORIOS (Persistencia / Acceso a Datos)
// =========================================================================
export const repositoriesModule = new ContainerModule(({ bind }) => {
    bind<IUserRepository>(TYPES.IUserRepository).to(UsersRepository).inSingletonScope();
    bind<IRolesRepository>(TYPES.IRolesRepository).to(RolesRepository).inSingletonScope();
    bind<IBruteForceRepository>(TYPES.IBruteForceRepository).to(BruteForceRepository).inSingletonScope();
    bind<ICryptoRepository>(TYPES.ICryptoRepository).to(RSACryptoRepository).inSingletonScope();
    bind<IWalletRepository>(TYPES.IWalletRepository).to(WalletRepository).inSingletonScope();
    bind<IWalletHistoryRepository>(TYPES.IWalletHistoryRepository).to(WalletHistoryRepository).inSingletonScope();
});

// =========================================================================
// 2. MÓDULO DE SERVICIOS (Infraestructura / Autenticación)
// =========================================================================
export const servicesModule = new ContainerModule(({ bind }) => {
    bind<ILoggerRepository>(TYPES.ILoggerRepository).to(LoggerRepository).inSingletonScope();
    bind<IPasswordHasher>(TYPES.IPasswordHasher).to(Argon2Hasher).inSingletonScope();
    bind<IAuthService>(TYPES.IAuthService).to(JwtAuthService).inSingletonScope();
});

// =========================================================================
// 3. MÓDULO DE CASOS DE USO (Reglas de Aplicación)
// =========================================================================
export const useCasesModule = new ContainerModule(({ bind }) => {
    bind<UsersUseCase>(TYPES.UsersUseCase).to(UsersUseCase);
    bind<RolesUseCase>(TYPES.RolesUseCase).to(RolesUseCase);
    bind<LoggerUseCase>(TYPES.LoggerUseCase).to(LoggerUseCase);
    bind<UserPasswordUseCase>(TYPES.UserPasswordUseCase).to(UserPasswordUseCase);
    bind<JwtUseCase>(TYPES.JwtUseCase).to(JwtUseCase);
    bind<BruteForceUseCase>(TYPES.BruteForceUseCase).to(BruteForceUseCase);
    bind<ProcessSecureDataUseCase>(TYPES.ProcessSecureDataUseCase).to(ProcessSecureDataUseCase);
    bind<WalletUseCase>(TYPES.WalletUseCase).to(WalletUseCase);
    bind<WalletHistoryUseCase>(TYPES.WalletHistoryUseCase).to(WalletHistoryUseCase);
});

// =========================================================================
// 4. MÓDULO DE CONTROLADORES (Manejadores HTTP y Sockets)
// =========================================================================
export const controllersModule = new ContainerModule(({ bind }) => {
    bind<RolesController>(TYPES.RolesController).to(RolesController);
    bind<UsersController>(TYPES.UsersController).to(UsersController);
    bind<WalletController>(TYPES.WalletController).to(WalletController);
    bind<WalletHistoryController>(TYPES.WalletHistoryController).to(WalletHistoryController);
});

// =========================================================================
// 5. MÓDULO DE RUTAS (Routing HTTP)
// =========================================================================
export const routesModule = new ContainerModule(({ bind }) => {
    bind<Routes>(TYPES.Routes).to(Routes).inSingletonScope();
    bind<UsersRoutes>(TYPES.UsersRoutes).to(UsersRoutes).inSingletonScope();
    bind<RolesRoutes>(TYPES.RolesRoutes).to(RolesRoutes).inSingletonScope();
    bind<WalletRoutes>(TYPES.WalletRoutes).to(WalletRoutes).inSingletonScope();
    bind<WalletHistoryRoutes>(TYPES.WalletHistoryRoutes).to(WalletHistoryRoutes).inSingletonScope();
});

// =========================================================================
// 6. MÓDULO DEL SERVIDOR, ADAPTADORES Y MIDDLEWARES (Infraestructura de Red)
// =========================================================================
export const serverModule = new ContainerModule(({ bind }) => {
    bind<ServerExpress>(TYPES.ServerExpress).to(ServerExpress).inSingletonScope();
    bind<BruteForceMiddleware>(TYPES.BruteForceMiddleware).to(BruteForceMiddleware).inSingletonScope();
    bind<GlobalErrorHandler>(TYPES.GlobalErrorHandler).to(GlobalErrorHandler).inSingletonScope();
    bind<ValidateMiddleware>(TYPES.ValidateMiddleware).to(ValidateMiddleware).inSingletonScope();
    bind<AuthMiddleware>(TYPES.AuthMiddleware).to(AuthMiddleware).inSingletonScope();
    bind<IpRestrictionMiddleware>(TYPES.IpRestrictionMiddleware).to(IpRestrictionMiddleware).inSingletonScope();
});

// =========================================================================
// 7. MÓDULO DE UTILIDADES (Helpers y Criptografía)
// =========================================================================
export const utilsModule = new ContainerModule(({ bind }) => {
    bind<UtilsData>(TYPES.UtilsData).to(UtilsData).inSingletonScope();
    bind<SecurityUtils>(TYPES.SecurityUtils).to(SecurityUtils).inSingletonScope();
    bind<CodeGeneratorService>(TYPES.CodeGeneratorService).to(CodeGeneratorService).inSingletonScope();
});

// =========================================================================
// INICIALIZACIÓN DEL CONTENEDOR GLOBAL (IoC Container)
// =========================================================================
const container = new Container();

container.load(
    dataSourceModule, // 🌟 Cargamos el módulo de transacciones y persistencia actualizado
    repositoriesModule,
    servicesModule,
    useCasesModule,
    controllersModule,
    routesModule,
    serverModule,
    utilsModule
);

export { container };