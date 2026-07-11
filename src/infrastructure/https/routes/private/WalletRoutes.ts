import { Router } from 'express';
import { injectable, inject } from 'inversify';
import { WalletController } from '@infra/https/controllers/WalletController';
import { AuthMiddleware } from '@infra/https/middlewares/AuthMiddleware';
import { TYPES } from '@app/dtos/models/types';

@injectable()
export class WalletRoutes {
    public readonly router: Router;

    constructor(
        @inject(TYPES.WalletController) private controller: WalletController,
        @inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.use(this.authMiddleware.execute);

        this.router.post('/register', (req, res, next) => {
            this.controller.create(req, res, next);
        });

        this.router.get('/', (req, res, next) => {
            this.controller.findAll(req, res, next);
        });

        this.router.get('/:id', (req, res, next) => {
            this.controller.findById(req, res, next);
        });

        this.router.get('/user/:id', (req, res, next) => {
            this.controller.findByUserId(req, res, next);
        });

        this.router.post('/transfer', (req, res, next) => {
            this.controller.createTransaction(req, res, next);
        });

        this.router.post('/', (req, res, next) => {
            this.controller.create(req, res, next);
        });

        this.router.put('/:id', (req, res, next) => {
            this.controller.update(req, res, next);
        });

    }
}