import { AuthPayload, IRefreshResult } from "@domain/services/JwtAuthService";

export interface IAuthService {
  generateToken(payload: AuthPayload): string;
  verifyToken(token: string): AuthPayload;
  rotateRefreshToken(encryptedRefreshToken: string): Promise<IRefreshResult>;
  invalidateToken(token: string): Promise<void>;
  generateRefreshToken(payload: AuthPayload): string;
}