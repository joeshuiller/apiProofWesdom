import { Router } from 'express';
import { UsersController } from '@infra/https/controllers/UsersController';
import { TYPES } from '@app/dtos/models/types';
import { inject, injectable } from 'inversify';
import { IpRestrictionMiddleware } from '@infra/https/middlewares/IpRestrictionMiddleware';
import { AuthMiddleware } from '@infra/https/middlewares/AuthMiddleware';

@injectable()
export class UsersRoutes {
    public readonly router: Router;

    constructor(
        @inject(TYPES.UsersController) private controller: UsersController,
        @inject(TYPES.IpRestrictionMiddleware) private ipRestrictionMiddleware: IpRestrictionMiddleware,
        @inject(TYPES.AuthMiddleware) private authMiddleware: AuthMiddleware
    ) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {

        // ==========================================
        // 1. RUTA DE REGISTRO
        // ==========================================
        this.router.post('/register', (req, res, next) => {
            this.controller.create(req, res, next);
        });


        // ==========================================
        // 2. RUTA DE LOGIN
        // ==========================================
        this.router.post('/login', (req, res, next) => {
            this.controller.login(req, res, next);
        });

        // ==========================================
        // 3. RUTA DE LOGOUT
        // ==========================================
        this.router.post('/logout', this.authMiddleware.execute, (req, res, next) => {
            this.controller.logoutJwt(req, res, next);
        });

        // 2. OBTENER TODOS LOS USUARIOS
        this.router.post('/all', this.authMiddleware.execute, (req, res, next) => {
            this.controller.findAll(req, res, next);
        });

        // 3. OBTENER UN USUARIO POR ID
        this.router.get('/:id', this.authMiddleware.execute, (req, res, next) => {
            this.controller.findById(req, res, next);
        });

        // 5. ACTUALIZAR UN USUARIOS
        this.router.put('/:id', this.authMiddleware.execute, (req, res, next) => {
            this.controller.update(req, res, next);
        });

        // 6. ELIMINAR UN USUARIOS
        this.router.delete('/:id', this.authMiddleware.execute, (req, res, next) => {
            this.controller.delete(req, res, next);
        });

    }
}