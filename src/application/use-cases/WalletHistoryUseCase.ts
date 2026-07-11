import { TYPES } from "@app/dtos/models/types";
import { TransferDTO } from "@app/dtos/request/TransferDTO";
import { TransferUpdateDTO } from "@app/dtos/request/TransferUpdateDTO";
import { WalletHistoryRequestDTO } from "@app/dtos/request/WalletHistoryRequestDTO";
import { WalletRequestDTO } from "@app/dtos/request/WalletRequestDTO";
import { WalletHistoryResponseDTO } from "@app/dtos/response/WalletHistoryResponseDTO";
import { WalletResponseDTO } from "@app/dtos/response/WalletResponseDTO";
import { TransactionStatus } from "@domain/models/TransactionStatus";
import { IWalletHistoryRepository } from "@domain/repositories/IWalletHistoryRepository";
import { IWalletRepository } from "@domain/repositories/IWalletRepository";
import { UnitOfWork } from "@domain/services/transaction/UnitOfWork";
import { inject, injectable } from "inversify";

@injectable()
export class WalletHistoryUseCase {

  constructor(
    @inject(TYPES.UnitOfWork) private readonly unitOfWork: UnitOfWork,
    @inject(TYPES.IWalletRepository) private walletRepository: IWalletRepository,
    @inject(TYPES.IWalletHistoryRepository) private walletHistoryRepository: IWalletHistoryRepository,
  ) {
  }

  async findById(id: string): Promise<WalletHistoryResponseDTO | null> {
    return await this.walletHistoryRepository.findById(id);
  }

  async findAll(): Promise<WalletHistoryResponseDTO[] | null> {
    return await this.walletHistoryRepository.findAll();
  }

  async updateStatus(dto: TransferUpdateDTO, id: string): Promise<WalletHistoryResponseDTO | null> {
    return await this.unitOfWork.execute(async () => {
      const senderWallet = await this.walletRepository.findByUserIdForUpdate(dto.senderId);
      const receiverWallet = await this.walletRepository.findByUserIdForUpdate(dto.receiverId);
      if (!senderWallet || !receiverWallet) {
        throw new Error("Billetera de origen o destino no encontrada");
      }

      // 1. Dominio puro: El Agregado Wallet maneja la regla de los $1000 USD
      const txStatus = this.debit(dto.amount, dto.status, senderWallet);
      const newReceiverWallet = this.credit(dto.amount, dto.status, receiverWallet);
      // Persistencia atómica transparente
      //await this.walletRepository.saveMultiple([txStatus.data, newReceiverWallet]);
      await this.walletRepository.update(txStatus, txStatus.id!);
      await this.walletRepository.update(newReceiverWallet, newReceiverWallet.id!);

      // Si el guardado del historial falla, el UnitOfWork realiza un ROLLBACK completo automáticamente
      const transaction: WalletHistoryRequestDTO = new WalletHistoryRequestDTO();
      transaction.senderId = dto.senderId;
      transaction.receiverId = dto.receiverId;
      transaction.amount = dto.amount;
      transaction.status = dto.status;
      return await this.walletHistoryRepository.update(transaction, id);
    });
  }

  /**
   * Ejecuta el débito aplicando la regla de los $1,000 USD.
   * @param amount Monto a transferir
   * @returns El estado con el que debe nacer la transacción
   */
  private debit(amount: number, status: TransactionStatus, item: WalletResponseDTO): WalletRequestDTO {
    const data: WalletRequestDTO = {
      id: item.id,
      availableBalance: Number(item.availableBalance),
      accountingBalance: Number(item.accountingBalance),
      usersId: item.users?.id ?? '0',
      version: item.version + 1
    }
    if (status === TransactionStatus.COMPLETED) {
      data.availableBalance = data.availableBalance - amount;
    } else if (status === TransactionStatus.FAILED) {
      data.availableBalance = data.availableBalance + amount;
    }
    return data;
  }

  /**
   * Ejecuta el crédito dependiendo del estado de la transferencia.
   * @param amount Monto a recibir
   * @param status Estado de la transacción entrante
   */
  private credit(amount: number, status: TransactionStatus, item: WalletResponseDTO): WalletRequestDTO {
    if (amount <= 0) {
      throw new Error("El monto a recibir debe ser mayor a cero.");
    }
    const data: WalletRequestDTO = {
      id: item.id,
      availableBalance: Number(item.availableBalance),
      accountingBalance: Number(item.accountingBalance),
      usersId: item.users?.id ?? '0',
      version: item.version + 1
    }
    if (status === TransactionStatus.COMPLETED) {
      data.availableBalance = data.availableBalance + amount;
    } else if (status === TransactionStatus.FAILED) {
      data.availableBalance = data.availableBalance - amount;
    }
    if (data.accountingBalance < amount) {
      data.accountingBalance = 0;
    } else {
      data.accountingBalance = data.accountingBalance - amount;
    }
    return data;
  }

}