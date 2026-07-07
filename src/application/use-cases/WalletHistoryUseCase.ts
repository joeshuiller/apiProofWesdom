import { TYPES } from "@app/dtos/models/types";
import { WalletHistoryResponseDTO } from "@app/dtos/response/WalletHistoryResponseDTO";
import { IWalletHistoryRepository } from "@domain/repositories/IWalletHistoryRepository";
import { inject, injectable } from "inversify";

@injectable()
export class WalletHistoryUseCase {

  constructor(
    @inject(TYPES.IWalletHistoryRepository) private walletHistoryRepository: IWalletHistoryRepository,
  ) {
  }

  async findById(id: string): Promise<WalletHistoryResponseDTO | null> {
    return await this.walletHistoryRepository.findById(id);
  }

  async findAll(): Promise<WalletHistoryResponseDTO[] | null> {
    return await this.walletHistoryRepository.findAll();
  }

}