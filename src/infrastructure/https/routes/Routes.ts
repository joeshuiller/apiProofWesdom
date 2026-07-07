import { Application, Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { injectable, inject } from 'inversify';
import { TYPES } from '@app/dtos/models/types';

// Importación de clases de rutas
import { UsersRoutes } from '@infra/https/routes/public/UsersRoute';
// Nota: Asegúrate de que Roles, WebHook y Campaigns también sean clases @injectable
import { RolesRoutes } from '@infra/https/routes/private/RolesRoute';

// Configuraciones
import { routersLink } from '@core/utils/RoutersLink';
import { BruteForceMiddleware } from '../middlewares/bruteForceMiddleware';
import { WalletHistoryRoutes } from './private/WalletHistoryRoutes';
import { WalletRoutes } from './private/WalletRoutes';


@injectable()
export class Routes {
    private readonly baseUrl: string;
    private readonly options = {
        explorer: true,
        customSiteTitle: "API Documentation"
    };
    constructor(
        // 💉 Inyectamos todas las rutas hijas
        @inject(TYPES.UsersRoutes) private usersRoutes: UsersRoutes,
        @inject(TYPES.RolesRoutes) private rolesRoutes: RolesRoutes,
        @inject(TYPES.BruteForceMiddleware) private bruteForceMiddleware: BruteForceMiddleware,
        @inject(TYPES.WalletHistoryRoutes) private walletHistoryRoutes: WalletHistoryRoutes,
        @inject(TYPES.WalletRoutes) private walletRoutes: WalletRoutes,
    ) {
        this.baseUrl = routersLink.api + routersLink.v;
    }

    /**
     * Este método es llamado desde ServerExpress enviando la instancia de 'app'
     */
    public setup(app: Application): void {
        const apiRouter = Router();
        apiRouter.use(this.bruteForceMiddleware.execute);
        // --- Configuración de Swagger ---
        const rootDir = process.cwd();
        const swaggerPath = path.resolve(rootDir, 'src/infrastructure/swagger_output.json');

        if (fs.existsSync(swaggerPath)) {
            // Leer el archivo de forma sincrónica para asegurar que esté cargado al iniciar
            const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

            apiRouter.use('/api-doc', swaggerUi.serve);
            apiRouter.get('/api-doc', swaggerUi.setup(swaggerDocument, {
                swaggerOptions: {
                    persistAuthorization: true // Mantiene el JWT al recargar
                }
            }, this.options));
        }

        // --- Montaje de Rutas Inyectadas (Sin 'new') ---
        apiRouter.use('/users', this.usersRoutes.router);
        apiRouter.use('/roles', this.rolesRoutes.router);
        apiRouter.use('/wallet-history', this.walletHistoryRoutes.router);
        apiRouter.use('/wallet', this.walletRoutes.router);

        // --- Montaje Final ---
        app.use(this.baseUrl, apiRouter);

        console.log(`🛣️  Rutas cargadas en base: ${this.baseUrl}`);
    }
}