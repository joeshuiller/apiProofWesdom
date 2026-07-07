import { TYPES } from "@app/dtos/models/types";
import { RolesRequestDTO } from "@app/dtos/request/RolesRequestDTO";
import { RolesResponseDTO } from "@app/dtos/response/RolesResponseDTO";
import { IRolesRepository } from "@domain/repositories/IRolesRepository";
import { inject, injectable } from "inversify";

@injectable()
export class RolesUseCase {
  constructor(
    @inject(TYPES.IRolesRepository) private rolesRepository: IRolesRepository
  ) { }

  async create(dto: RolesRequestDTO): Promise<RolesResponseDTO | null> {
    return await this.rolesRepository.save(dto);
  }

  async findById(id: string): Promise<RolesResponseDTO | null> {
    return await this.rolesRepository.findById(id);
  }

  async findByAll(): Promise<RolesResponseDTO[] | []> {
    return await this.rolesRepository.findByAll();
  }

  async update(id: string, dto: RolesRequestDTO): Promise<RolesResponseDTO | null> {
    return await this.rolesRepository.update(id, dto);
  }

  async delete(id: number): Promise<boolean> {
    return await this.rolesRepository.delete(id);
  }
}