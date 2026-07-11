import { RolesRequestDTO } from "@app/dtos/request/RolesRequestDTO";
import { RolesResponseDTO } from "@app/dtos/response/RolesResponseDTO";
import { RolesEntity } from "@domain/entities/RolesEntity";
import { IRolesRepository } from "@domain/repositories/IRolesRepository";
import { AppDataSource } from "@infra/database/dataSource";
import { injectable, inject } from "inversify";
import { RolesMapperService } from "./mappers/RolesMapperService";
import { BaseRepository } from "./BaseRepository";
import { TYPES } from "@app/dtos/models/types";
import { TransactionContext } from "./transaction/TransactionContext";
import { DataSource } from "typeorm";

@injectable()
export class RolesRepository extends BaseRepository<RolesEntity> implements IRolesRepository {
  private usersMapper: RolesMapperService;
  constructor(
    @inject(TYPES.TransactionContext) txContext: TransactionContext,
    @inject(TYPES.DataSource) dataSource: DataSource
  ) {
    super(RolesEntity, txContext, dataSource);
    this.usersMapper = new RolesMapperService();
  }

  async findByAll(): Promise<RolesResponseDTO[]> {
    const user = await this.currentRepository.find();
    const dataUsersMapper = user.map(user => this.usersMapper.toUpdateEntity(user));
    return dataUsersMapper;
  }

  async findById(id: string): Promise<RolesResponseDTO | null> {
    const user = await this.currentRepository.findOneBy({ id: id });
    return user ? this.usersMapper.toUpdateEntity(user) : null;
  }

  async findByName(name: string): Promise<RolesResponseDTO | null> {
    const user = await this.currentRepository.findOneBy({ name });
    return user ? this.usersMapper.toUpdateEntity(user) : null;
  }

  async update(id: string, user: RolesRequestDTO): Promise<RolesResponseDTO | null> {
    await this.currentRepository.update(id, this.usersMapper.toEntity(user));
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.currentRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async save(rol: RolesRequestDTO): Promise<RolesResponseDTO | null> {
    const userList = await this.currentRepository.save(this.usersMapper.toEntity(rol));
    return this.usersMapper.toUpdateEntity(userList);
  }
}