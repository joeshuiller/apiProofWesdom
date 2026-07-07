import { injectable } from "inversify";
import { IBruteForceRepository } from "@domain/repositories/IBruteForceRepository";
import { AttemptRecord } from "@app/dtos/response/AttemptRecord";

@injectable()
export class BruteForceRepository implements IBruteForceRepository {
    private storage = new Map<string, AttemptRecord>();
    private blacklist = new Map<string, Date>();

    async getRecord(ip: string): Promise<AttemptRecord | null> {
        return this.storage.get(ip) || null;
    }

    async saveRecord(ip: string, record: AttemptRecord): Promise<void> {
        this.storage.set(ip, record);
    }

    async resetRecord(ip: string): Promise<void> {
        this.storage.delete(ip);
    }

    /**
     * I-blacklist ti token iti memoria.
     */
    async addToBlacklist(token: string, expiresAt: Date): Promise<void> {
        this.blacklist.set(token, expiresAt);

        // Saneamiento/Limpieza automatiko ti expired tokens iti memoria tapno saan a mapunno ti RAM
        this.cleanExpiredTokens();
    }

    /**
     * Kitaen no ti token ket adda iti blacklist ti memoria.
     */
    async isTokenBlacklisted(token: string): Promise<boolean> {
        const expiration = this.blacklist.get(token);
        if (!expiration) return false;

        // No ti token ket expired-en ti aldawna, saanen a nabileg ket mairuar iti blacklist
        if (expiration.getTime() <= Date.now()) {
            this.blacklist.delete(token);
            return false;
        }

        return true;
    }

    /**
     * I-revoke aminen a session ti usari iti in-memory storage.
     */
    async revokeAllUserTokens(userId: number | string): Promise<void> {
        console.log(`[InMemory] Revoking all sessions for user: ${userId}`);
        // Sadiay database daytoy addaan pudno nga implementasyon
    }

    /**
     * Saneamiento ti expired tokens iti in-memory storage.
     */
    private cleanExpiredTokens(): void {
        const now = Date.now();
        for (const [token, expiration] of this.blacklist.entries()) {
            if (expiration.getTime() <= now) {
                this.blacklist.delete(token);
            }
        }
    }
}