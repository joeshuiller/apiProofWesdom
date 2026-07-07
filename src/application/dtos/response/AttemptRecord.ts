export interface AttemptRecord {
    count: number;
    lastAttempt: number;
    blockedUntil: number | null;
}