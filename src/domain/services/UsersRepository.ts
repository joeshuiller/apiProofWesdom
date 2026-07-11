import { UsersEntity } from "../entities/UsersEntity";
import { AppDataSource } from "../../infrastructure/database/dataSource";
import { IUserRepository } from "../repositories/IUserRepository";
import { UsersRequestDTO } from "../../application/dtos/request/UsersRequestDTO";
import { UsersResponseDTO } from "../../application/dtos/response/UsersResponseDTO";
import { UsersMapperService } from "./mappers/UsersMapperService";
import { injectable, inject } from "inversify";
import { BaseRepository } from "./BaseRepository";
import { TYPES } from "@app/dtos/models/types";
import { TransactionContext } from "./transaction/TransactionContext";
import { DataSource } from "typeorm";

@injectable()
export class UsersRepository extends BaseRepository<UsersEntity> implements IUserRepository {
  private usersMapper: UsersMapperService;

  constructor(
    @inject(TYPES.TransactionContext) txContext: TransactionContext,
    @inject(TYPES.DataSource) dataSource: DataSource
  ) {
    super(UsersEntity, txContext, dataSource);
    this.usersMapper = new UsersMapperService();
  }

  async findById(id: string): Promise<UsersResponseDTO | null> {
    const user = await this.currentRepository.findOne({
      where: { id: id }, // El filtro va dentro de 'where'
      relations: ['rolesId'] // 👈 Agrega aquí las relaciones que necesites
    });
    return user ? this.usersMapper.toUpdateEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UsersResponseDTO | null> {
    const user = await this.currentRepository.findOne({
      where: { email }, // El filtro va dentro de 'where'
      relations: ['rolesId'] // 👈 Agrega aquí las relaciones que necesites
    });
    return user ? this.usersMapper.toUpdateEntity(user) : null;
  }

  async update(id: string, user: UsersRequestDTO): Promise<UsersResponseDTO | null> {
    await this.currentRepository.update(id, this.usersMapper.toEntity(user));
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.currentRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async save(user: UsersRequestDTO): Promise<UsersResponseDTO | null> {
    const userList = await this.currentRepository.save(this.usersMapper.toEntity(user));
    return this.usersMapper.toUpdateEntity(userList);
  }

  async findAll(idRol: string): Promise<UsersResponseDTO[] | null> {
    const users = await this.currentRepository.find({
      where: {
        rolesId: { id: idRol }
      },
      relations: ['rolesId']
    });

    // 👇 2. MEJORA LÓGICA 👇
    // map() siempre retorna un arreglo ([]), por lo que (data ? data : null) nunca era null.
    // Ahora validamos correctamente si la base de datos no devolvió nada.
    if (!users || users.length === 0) {
      return null;
    }

    return users.map((dto) => this.usersMapper.toUpdateEntity(dto));
  }
}