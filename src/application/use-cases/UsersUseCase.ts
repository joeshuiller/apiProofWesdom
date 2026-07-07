import { UserPasswordUseCase } from './UserPasswordUseCase';
import { TYPES } from "@app/dtos/models/types";
import { UsersRequestDTO } from "@app/dtos/request/UsersRequestDTO";
import { UsersResponseDTO } from "@app/dtos/response/UsersResponseDTO";
import { DomainError } from '@core/errors/DomainError';
import { UtilsData } from '@core/utils/UtilsData';
import { IUserRepository } from "@domain/repositories/IUserRepository";
import { container } from '@infra/di/inversifyConfig';
import { inject, injectable } from "inversify";

@injectable()
export class UsersUseCase {

  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
    @inject(TYPES.UtilsData) private readonly utilsData: UtilsData,
    @inject(TYPES.UserPasswordUseCase) private readonly userPasswordUseCase: UserPasswordUseCase
  ) {
  }

  async create(dto: UsersRequestDTO): Promise<UsersResponseDTO | null> {
    if (dto.imgClients !== undefined && dto.imgClients !== null) {
      dto.imgClients = await this.utilsData.saveImages(dto.imgClients, "imgUsers");
    }
    dto.password = await this.userPasswordUseCase.create(dto.password);
    return await this.userRepository.save(dto);
  }

  async findById(id: string): Promise<UsersResponseDTO | null> {
    return await this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<UsersResponseDTO | null> {
    return await this.userRepository.findByEmail(email);
  }

  async update(id: string, dto: UsersRequestDTO): Promise<UsersResponseDTO | null> {
    if (dto.imgClients !== undefined && dto.imgClients !== null) {
      const data = dto.imgClients.startsWith('base64')
      dto.imgClients = data ? await this.utilsData.saveImages(dto.imgClients, "imgUsers") : dto.imgClients;
    }
    dto.password = await this.userPasswordUseCase.create(dto.password);
    return await this.userRepository.update(id, dto);
  }

  async delete(id: string): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  async findAll(idRol: string): Promise<UsersResponseDTO[] | null> {
    return await this.userRepository.findAll(idRol);
  }

}