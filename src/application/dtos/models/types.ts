/**
 * Diccionario centralizado de Símbolos (Tokens de Inyección) para InversifyJS.
 * 🔑 REGLA DE ORO DE ARQUITECTURA: Este archivo NO debe importar ningún otro archivo
 * del sistema para garantizar que nunca existan dependencias circulares.
 */
export const TYPES = {
    // --- INFRASTRUCTURE / SERVER ---
    ServerExpress: Symbol.for("ServerExpress"),
    SocketAdapter: Symbol.for("SocketAdapter"),
    Routes: Symbol.for("Routes"),
    MessageHandler: Symbol.for("MessageHandler"),
    IPasswordHasher: Symbol.for("IPasswordHasher"),
    IAuthService: Symbol.for("IAuthService"),
    BruteForceMiddleware: Symbol.for("BruteForceMiddleware"),
    GlobalErrorHandler: Symbol.for("GlobalErrorHandler"),
    ValidateMiddleware: Symbol.for("ValidateMiddleware"),
    AuthMiddleware: Symbol.for("AuthMiddleware"),
    IpRestrictionMiddleware: Symbol.for("IpRestrictionMiddleware"),

    // --- DOMAIN / REPOSITORIES ---
    IWalletRepository: Symbol.for("IWalletRepository"),
    IWalletHistoryRepository: Symbol.for("IWalletHistoryRepository"),
    IUserRepository: Symbol.for("IUserRepository"),
    ILoggerRepository: Symbol.for("ILoggerRepository"),
    IRolesRepository: Symbol.for("IRolesRepository"),
    ITypeProyectsRepository: Symbol.for("ITypeProyectsRepository"),
    IBruteForceRepository: Symbol.for("IBruteForceRepository"),
    ICryptoRepository: Symbol.for("ICryptoRepository"),

    // --- APPLICATION / USE CASES ---
    UsersUseCase: Symbol.for("UsersUseCase"),
    WalletUseCase: Symbol.for("WalletUseCase"),
    WalletHistoryUseCase: Symbol.for("WalletHistoryUseCase"),
    RolesUseCase: Symbol.for("RolesUseCase"),
    LoggerUseCase: Symbol.for("LoggerUseCase"),
    UserPasswordUseCase: Symbol.for("UserPasswordUseCase"),
    JwtUseCase: Symbol.for("JwtUseCase"),
    BruteForceUseCase: Symbol.for("BruteForceUseCase"),
    ProcessSecureDataUseCase: Symbol.for("ProcessSecureDataUseCase"),

    // --- PRESENTATION / CONTROLLERS ---
    UsersController: Symbol.for("UsersController"),
    WalletController: Symbol.for("WalletController"),
    WalletHistoryController: Symbol.for("WalletHistoryController"),
    RolesController: Symbol.for("RolesController"),

    // --- ROUTES ---
    UsersRoutes: Symbol.for("UsersRoutes"),
    WalletRoutes: Symbol.for("WalletRoutes"),
    WalletHistoryRoutes: Symbol.for("WalletHistoryRoutes"),
    RolesRoutes: Symbol.for("RolesRoutes"),
    // --- CORE / UTILS ---
    UtilsData: Symbol.for("UtilsData"),
    SecurityUtils: Symbol.for("SecurityUtils"),
    CodeGeneratorService: Symbol.for("CodeGeneratorService"),
    UnitOfWork: Symbol.for("UnitOfWork"),
    TransactionContext: Symbol.for("TransactionContext"),
    AppDataSource: Symbol.for('AppDataSource'),
    DataSource: Symbol.for("DataSource"),
};