import { Request, Response, NextFunction } from 'express';
import { InitialController } from '@infra/https/controllers/InitialController';

/**
 * ✅ CONFIGURACIÓN GLOBAL DE ENTORNO PARA TESTS:
 * Para evitar el error "ERROR CONFIG: La variable de entorno es obligatoria",
 * definimos valores ficticios antes de que se dispare la cadena de imports.
 */
process.env.DB_HOST = "localhost";
process.env.DB_PORT = "5432";
process.env.DB_USER = "test_user";
process.env.DB_USERNAME = "test_user"; // 👈 Agregado para cumplir con la validación específica
process.env.DB_PASSWORD = "test_password";
process.env.DB_NAME = "test_db";
process.env.JWT_SECRET = "test_secret";
process.env.GEMINI_API_KEY = "uyerygreu";
process.env.ENCRYPTION_KEY = "d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2";
process.env.ENCRYPTION_SALT = "8f1a2b3c4d5e6f7a";
describe('InitialController', () => {
    let controller: InitialController;
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        controller = new InitialController();

        // Mock de Express Response
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        req = {};
        next = jest.fn();
    });

    it('should return 200 and a status online message', () => {
        // Ejecutamos el método
        controller.initial(req as Request, res as Response, next);

        // Verificamos que se llame al status 200
        expect(res.status).toHaveBeenCalledWith(200);

        // Verificamos la estructura del JSON
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'online',
                message: expect.stringContaining('funcionando correctamente'),
                timestamp: expect.any(String)
            })
        );
    });

    it('should return a valid ISO timestamp', () => {
        controller.initial(req as Request, res as Response, next);

        // Extraemos los argumentos enviados a res.json
        const jsonResponse = (res.json as jest.Mock).mock.calls[0][0];

        // Validamos que el timestamp sea una fecha válida
        const date = Date.parse(jsonResponse.timestamp);
        expect(isNaN(date)).toBe(false);
    });
});