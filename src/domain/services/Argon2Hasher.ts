import { IPasswordHasher } from '@domain/repositories/IPasswordHasher';
import argon2 from 'argon2';

import { injectable } from "inversify";

@injectable()
export class Argon2Hasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    // Configuración recomendada para 2026
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64MB
      timeCost: 3,
      parallelism: 1
    });
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plainText);
  }
}