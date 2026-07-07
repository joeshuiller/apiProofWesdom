import { AttemptRecord } from "@app/dtos/response/AttemptRecord";

export interface IBruteForceRepository {
    getRecord(ip: string): Promise<AttemptRecord | null>;
    saveRecord(ip: string, record: AttemptRecord): Promise<void>;
    resetRecord(ip: string): Promise<void>;
    /**
     * I-blacklist ti token no ag-logout ti usari tapno mairuar ti session-na.
     * @param token Ti string ti token a masapul a ma-blacklist.
     * @param expiresAt Ti aldaw ken oras no kaano nga ag-expire ti token.
     */
    addToBlacklist(token: string, expiresAt: Date): Promise<void>;

    /**
     * Kitaen no ti token ket adda iti blacklist tapno saan a mabalin ti sumrek.
     * @param token Ti string ti token a ma-verify.
     */
    isTokenBlacklisted(token: string): Promise<boolean>;

    /**
     * I-revoke aminen a nabileg a tokens ti maysa nga usari gapu ti sekyuridad.
     * @param userId Ti ID ti usari.
     */
    revokeAllUserTokens(userId: number | string): Promise<void>;
}