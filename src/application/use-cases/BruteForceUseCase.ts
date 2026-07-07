import { injectable, inject } from "inversify";
import { TYPES } from "@app/dtos/models/types";
import { IBruteForceRepository } from "@domain/repositories/IBruteForceRepository";

@injectable()
export class BruteForceUseCase {
    // Configuración de la política de seguridad
    private readonly MAX_ATTEMPTS = 5;
    private readonly WINDOW_MS = 15 * 60 * 1000;      // 15 minutos
    private readonly BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutos

    constructor(
        @inject(TYPES.IBruteForceRepository) private repository: IBruteForceRepository
    ) { }

    /**
     * checkAttemptStatus
     * Verifica si una IP tiene el acceso restringido.
     * Este es el método que invoca el middleware de validación.
     */
    async checkAttemptStatus(ip: string): Promise<{ isBlocked: boolean; remainingMinutes?: number }> {
        const record = await this.repository.getRecord(ip);

        if (!record) return { isBlocked: false };

        const currentTime = Date.now();

        // 1. Verificar si hay un bloqueo temporal activo
        if (record.blockedUntil && currentTime < record.blockedUntil) {
            const remaining = Math.ceil((record.blockedUntil - currentTime) / 60000);
            return { isBlocked: true, remainingMinutes: remaining };
        }

        // 2. Resetear contador si ha pasado el tiempo de la ventana sin actividad
        if (currentTime - record.lastAttempt > this.WINDOW_MS) {
            await this.repository.resetRecord(ip);
            return { isBlocked: false };
        }

        return { isBlocked: false };
    }

    /**
     * registerFailedAttempt
     * Registra un fallo de validación o autenticación.
     */
    async registerFailedAttempt(ip: string): Promise<void> {
        let record = await this.repository.getRecord(ip);
        const currentTime = Date.now();

        if (!record) {
            record = { count: 1, lastAttempt: currentTime, blockedUntil: null };
        } else {
            record.count += 1;
            record.lastAttempt = currentTime;

            if (record.count >= this.MAX_ATTEMPTS) {
                record.blockedUntil = currentTime + this.BLOCK_DURATION_MS;
            }
        }

        await this.repository.saveRecord(ip, record);
    }

    /**
     * clearAttempts
     * Limpia los intentos tras un éxito (ej. Login exitoso).
     */
    async clearAttempts(ip: string): Promise<void> {
        await this.repository.resetRecord(ip);
    }
}