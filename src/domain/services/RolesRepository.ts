import { RolesRequestDTO } from "@app/dtos/request/RolesRequestDTO";
import { RolesResponseDTO } from "@app/dtos/response/RolesResponseDTO";
import { RolesEntity } from "@domain/entities/RolesEntity";
import { IRolesRepository } from "@domain/repositories/IRolesRepository";
import { AppDataSource } from "@infra/database/dataSource";
import { injectable } from "inversify";
import { RolesMapperService } from "./mappers/RolesMapperService";

@injectable()
export class RolesRepository implements IRolesRepository {
  private usersMapper: RolesMapperService;
  constructor() {
    this.usersMapper = new RolesMapperService();
  }

  private get repository() {
    return AppDataSource.getRepository(RolesEntity);
  }

  async findByAll(): Promise<RolesResponseDTO[]> {
    const user = await this.repository.find();
    const dataUsersMapper = user.map(user => this.usersMapper.toUpdateEntity(user));
    return dataUsersMapper;
  }

  async findById(id: string): Promise<RolesResponseDTO | null> {
    const user = await this.repository.findOneBy({ id: id });
    return user ? this.usersMapper.toUpdateEntity(user) : null;
  }

  async findByName(name: string): Promise<RolesResponseDTO | null> {
    const user = await this.repository.findOneBy({ name });
    return user ? this.usersMapper.toUpdateEntity(user) : null;
  }

  async update(id: string, user: RolesRequestDTO): Promise<RolesResponseDTO | null> {
    await this.repository.update(id, this.usersMapper.toEntity(user));
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async save(rol: RolesRequestDTO): Promise<RolesResponseDTO | null> {
    const userList = await this.repository.save(this.usersMapper.toEntity(rol));
    return this.usersMapper.toUpdateEntity(userList);
  }
}