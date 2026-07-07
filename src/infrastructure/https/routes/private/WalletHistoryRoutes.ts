import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { WalletHistoryController } from '@infra/https/controllers/WalletHistoryController';
import { AuthMiddleware } from '@infra/https/middlewares/AuthMiddleware';
import { TYPES } from '@app/dtos/models/types';

@injectable()
export class WalletHistoryRoutes {
    public readonly router: Router;

    constructor(
        @inject(TYPES.WalletHistoryController) private controller: WalletHistoryController,
        @inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.use(this.authMiddleware.execute);

        this.router.get('/', (req, res, next) => {
            this.controller.findAll(req, res, next);
        });

        this.router.get('/:id', (req, res, next) => {
            this.controller.findById(req, res, next);
        });
    }
}