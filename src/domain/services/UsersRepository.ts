import { UsersEntity } from "../entities/UsersEntity";
import { AppDataSource } from "../../infrastructure/database/dataSource";
import { IUserRepository } from "../repositories/IUserRepository";
import { UsersRequestDTO } from "../../application/dtos/request/UsersRequestDTO";
import { UsersResponseDTO } from "../../application/dtos/response/UsersResponseDTO";
import { UsersMapperService } from "./mappers/UsersMapperService";
import { injectable } from "inversify";

@injectable()
export class UsersRepository implements IUserRepository {
  private usersMapper: UsersMapperService;

  constructor() {
    this.usersMapper = new UsersMapperService();
  }


  // 👇 1. LA MEJORA PRINCIPAL (El Patrón Getter) 👇
  // Retrasamos la obtención del repositorio hasta el momento exacto de la consulta.
  // Esto evita el error de "No metadata for UsersEntity was found".
  private get repository() {
    return AppDataSource.getRepository(UsersEntity);
  }

  async findById(id: string): Promise<UsersResponseDTO | null> {
    const user = await this.repository.findOne({
      where: { id: id }, // El filtro va dentro de 'where'
      relations: ['rolesId'] // 👈 Agrega aquí las relaciones que necesites
    });
    return user ? this.usersMapper.toUpdateEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UsersResponseDTO | null> {
    const user = await this.repository.findOne({
      where: { email }, // El filtro va dentro de 'where'
      relations: ['rolesId'] // 👈 Agrega aquí las relaciones que necesites
    });
    return user ? this.usersMapper.toUpdateEntity(user) : null;
  }

  async update(id: string, user: UsersRequestDTO): Promise<UsersResponseDTO | null> {
    await this.repository.update(id, this.usersMapper.toEntity(user));
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async save(user: UsersRequestDTO): Promise<UsersResponseDTO | null> {
    const userList = await this.repository.save(this.usersMapper.toEntity(user));
    return this.usersMapper.toUpdateEntity(userList);
  }

  async findAll(idRol: string): Promise<UsersResponseDTO[] | null> {
    const users = await this.repository.find({
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