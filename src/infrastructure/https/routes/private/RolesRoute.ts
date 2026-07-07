import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { RolesController } from '@infra/https/controllers/RolesController';
import { AuthMiddleware } from '@infra/https/middlewares/AuthMiddleware';
import { TYPES } from '@app/dtos/models/types';

@injectable()
export class RolesRoutes {
    public readonly router: Router;

    constructor(
        @inject(TYPES.RolesController) private controller: RolesController,
        @inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.use(this.authMiddleware.execute);

        // 1. RUTA DE CREACIÓN DE ROL
        this.router.post('/register', (req, res, next) => {
            this.controller.create(req, res, next);
        });

        // 2. RUTA PARA OBTENER TODOS LOS ROLES
        this.router.get('/', (req, res, next) => {
            this.controller.findAllRoles(req, res, next);
        });
    }
}