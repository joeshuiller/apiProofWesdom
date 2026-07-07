import { UsersRequestDTO } from "../../application/dtos/request/UsersRequestDTO";
import { UsersResponseDTO } from "../../application/dtos/response/UsersResponseDTO";

export interface IUserRepository {
  findById(id: string): Promise<UsersResponseDTO | null>;
  findAll(idRol: string): Promise<UsersResponseDTO[] | null>;
  findByEmail(email: string): Promise<UsersResponseDTO | null>;
  save(user: UsersRequestDTO): Promise<UsersResponseDTO | null>;
  update(id: string, user: UsersRequestDTO): Promise<UsersResponseDTO | null>;
  delete(id: string): Promise<boolean>;
}