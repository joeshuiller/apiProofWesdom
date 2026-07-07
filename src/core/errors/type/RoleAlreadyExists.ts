import { DomainError } from "../DomainError";

export class RoleAlreadyExists extends DomainError {
  constructor(role: string) {
    super(`El rol ${role} ya existe en el sistema.`);
  }
}