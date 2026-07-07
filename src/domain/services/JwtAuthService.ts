import jwt, { Secret } from 'jsonwebtoken';
import { inject, injectable } from "inversify";
import { IAuthService } from '@domain/repositories/IAuthService';
import { TYPES } from '@app/dtos/models/types';
import { IBruteForceRepository } from '@domain/repositories/IBruteForceRepository';

// 🔑 Kadagiti pag-auth a detalye (Strongly Typed Payload)
export interface AuthPayload extends jwt.JwtPayload {
  userId: number | string;
  rolesId: number | string;
  email?: string;
}

export interface IRefreshResult {
  success: boolean;
  accessToken?: string;
  newRefreshToken?: string;
  message: string;
}
@injectable()
export class JwtAuthService implements IAuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || "access_secret_key";
  private readonly REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret_key";
  // ⏳ Ti kapaut ti biag ti token (Configurable manipud .env)
  // We cast these as 'any' to bypass the strict StringValue union check from jsonwebtoken/ms
  private readonly ACCESS_TOKEN_EXPIRY = (process.env.ACCESS_TOKEN_EXPIRY || "2h") as any;
  private readonly REFRESH_TOKEN_EXPIRY = (process.env.REFRESH_TOKEN_EXPIRY || "7d") as any;
  constructor(
    @inject(TYPES.IBruteForceRepository) private readonly tokenRepository: IBruteForceRepository
  ) { }

  /**
       * Mangaramid ti baro nga Access Token para iti usari.
       * @param payload Dagiti impormasion ti identipikasion ti usari.
       */
  public generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
  }

  /**
   * Mangaramid ti baro a Refresh Token tapno mapagtalinaed ti session.
   */
  public generateRefreshToken(payload: AuthPayload): string {
    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });
  }

  /**
   * 🛡️ Siguraduen ken i-verify ti nabileg nga Access Token (Casting to AuthPayload).
   * @param token Ti string ti token a masapul a ma-verify.
   */
  public verifyToken(token: string): AuthPayload {
    const cleanToken = token.replace(/^Bearer\s+/i, "").replace(/["']/g, "").trim();
    const verify = jwt.verify(cleanToken, this.JWT_SECRET);
    return verify as AuthPayload;
  }

  /**
   * I-blacklist ti token no ag-logout ti usari tapno mairuar ti session-na.
   */
  public async invalidateToken(token: string): Promise<void> {
    try {
      const cleanToken = token.replace(/^Bearer\s+/i, "").replace(/["']/g, "").trim();
      const decoded = jwt.decode(cleanToken) as { exp: number };

      if (!decoded || !decoded.exp) return;

      const expirationDate = new Date(decoded.exp * 1000);

      if (expirationDate.getTime() <= Date.now()) return;

      await this.tokenRepository.addToBlacklist(token, expirationDate);
    } catch (error) {
      console.error("❌ Add-to-blacklist a biddut ti kaso ti usari:", error);
      throw new Error("Saan a na-proseso ti panag-invalidar ti token ti session.");
    }
  }

  /**
   * I-proseso ti panag-rotate ti Refresh Token tapno mangted ti baro a pares ti tokens.
   */
  public async rotateRefreshToken(encryptedRefreshToken: string): Promise<IRefreshResult> {
    try {
      if (!encryptedRefreshToken) {
        return { success: false, message: "Saan a nabirukan ti Refresh token." };
      }

      // 1. Kitaen ti kriptograpiko a pirma ti Refresh Token
      let decoded: any;
      try {
        decoded = jwt.verify(encryptedRefreshToken, this.REFRESH_SECRET);
      } catch (err) {
        return { success: false, message: "Saan a nabileg wenno expired ti Refresh token." };
      }

      // 2. Kontrol ti Estado (Stateful): Kitaen no ti token ket adda iti blacklist
      const isRevoked = await this.tokenRepository.isTokenBlacklisted(encryptedRefreshToken);
      if (isRevoked) {
        await this.tokenRepository.revokeAllUserTokens(decoded.userId);
        return {
          success: false,
          message: "Bantay sekyuridad: Nausar manen ti token. Naikkat aminen a session."
        };
      }

      // 3. I-blacklist (puoran) ti agdama a Refresh Token tapno saan a mausar manen
      const expirationDate = new Date(decoded.exp * 1000);
      await this.tokenRepository.addToBlacklist(encryptedRefreshToken, expirationDate);

      // 4. Mangaramid ti baro a hugo ti Tokens (Access + New Refresh)
      const tokenPayload: AuthPayload = {
        userId: decoded.userId,
        rolesId: decoded.role,
        email: decoded.email
      };

      const newAccessToken = this.generateToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken(tokenPayload);

      return {
        success: true,
        accessToken: newAccessToken,
        newRefreshToken: newRefreshToken,
        message: "Nabagbago dagiti tokens."
      };

    } catch (error) {
      console.error("💥 Kritikal a biddut iti panag-rotate ti Refresh Token:", error);
      return { success: false, message: "Biddut ti sistema iti panag-refresh ti session." };
    }
  }
}