import { RolesRequestDTO } from "@app/dtos/request/RolesRequestDTO";
import { RolesResponseDTO } from "@app/dtos/response/RolesResponseDTO";

export interface IRolesRepository {
  findById(id: string): Promise<RolesResponseDTO | null>;
  findByAll(): Promise<RolesResponseDTO[]>;
  findByName(name: string): Promise<RolesResponseDTO | null>;
  save(rol: RolesRequestDTO): Promise<RolesResponseDTO | null>;
  update(id: string, rol: RolesRequestDTO): Promise<RolesResponseDTO | null>;
  delete(id: number): Promise<boolean>;
}