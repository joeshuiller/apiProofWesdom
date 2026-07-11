import { TYPES } from "@app/dtos/models/types";
import { TransferDTO } from "@app/dtos/request/TransferDTO";
import { WalletHistoryRequestDTO } from "@app/dtos/request/WalletHistoryRequestDTO";
import { WalletRequestDTO } from "@app/dtos/request/WalletRequestDTO";
import { WalletHistoryResponseDTO } from "@app/dtos/response/WalletHistoryResponseDTO";
import { WalletResponseDTO } from "@app/dtos/response/WalletResponseDTO";
import { UtilsData } from '@core/utils/UtilsData';
import { TransactionStatus } from "@domain/models/TransactionStatus";
import { IWalletHistoryRepository } from "@domain/repositories/IWalletHistoryRepository";
import { IWalletRepository } from '@domain/repositories/IWalletRepository';
import { UnitOfWork } from "@domain/services/transaction/UnitOfWork";
import { inject, injectable } from "inversify";

@injectable()
export class WalletUseCase {
  constructor(
    @inject(TYPES.UnitOfWork) private readonly unitOfWork: UnitOfWork,
    @inject(TYPES.IWalletRepository) private walletRepository: IWalletRepository,
    @inject(TYPES.IWalletHistoryRepository) private walletHistoryRepository: IWalletHistoryRepository,
  ) {
  }

  async create(dto: TransferDTO): Promise<WalletHistoryResponseDTO | null> {
    return await this.unitOfWork.execute(async () => {
      const senderWallet = await this.walletRepository.findByUserIdForUpdate(dto.senderId);
      const receiverWallet = await this.walletRepository.findByUserIdForUpdate(dto.receiverId);
      if (!senderWallet || !receiverWallet) {
        throw new Error("Billetera de origen o destino no encontrada");
      }

      // 1. Dominio puro: El Agregado Wallet maneja la regla de los $1000 USD
      const txStatus = this.debit(dto.amount, senderWallet);
      const newReceiverWallet = this.credit(dto.amount, txStatus.status, receiverWallet);
      // Persistencia atómica transparente
      //await this.walletRepository.saveMultiple([txStatus.data, newReceiverWallet]);
      await this.walletRepository.update(txStatus.data, txStatus.data?.id!);
      await this.walletRepository.update(newReceiverWallet, newReceiverWallet?.id!);

      // Si el guardado del historial falla, el UnitOfWork realiza un ROLLBACK completo automáticamente
      const transaction: WalletHistoryRequestDTO = new WalletHistoryRequestDTO();
      transaction.senderId = dto.senderId;
      transaction.receiverId = dto.receiverId;
      transaction.amount = dto.amount;
      transaction.status = txStatus.status;
      return await this.walletHistoryRepository.save(transaction);
    });
  }

  async save(item: WalletRequestDTO): Promise<WalletResponseDTO | null> {
    return await this.walletRepository.save(item);
  }

  async findById(id: string): Promise<WalletResponseDTO | null> {
    return await this.walletRepository.findById(id);
  }

  async findByUserId(id: string): Promise<WalletResponseDTO | null> {
    return await this.walletRepository.findByUserId(id);
  }

  async findAll(): Promise<WalletResponseDTO[] | null> {
    return await this.walletRepository.findAll();
  }

  async update(item: WalletRequestDTO, id: string): Promise<WalletResponseDTO | null> {
    return await this.walletRepository.update(item, id);
  }


  // --- REGLAS DE NEGOCIO ---

  /**
   * Ejecuta el débito aplicando la regla de los $1,000 USD.
   * @param amount Monto a transferir
   * @returns El estado con el que debe nacer la transacción
   */
  private debit(amount: number, item: WalletResponseDTO): { status: TransactionStatus, data: WalletRequestDTO } {
    if (amount <= 0) {
      throw new Error("El monto de la transferencia debe ser mayor a cero.");
    }

    if (item.availableBalance < amount) {
      throw new Error("Saldo insuficiente."); // Este error mapeará a un HTTP 422
    }
    const data: WalletRequestDTO = {
      id: item.id,
      availableBalance: Number(item.availableBalance),
      accountingBalance: Number(item.accountingBalance),
      usersId: item.users?.id ?? '0',
      version: item.version + 1
    }
    // Siempre bloqueamos el dinero disponible para evitar un doble gasto
    data.availableBalance = data.availableBalance - amount;

    // Regla de Compliance: Tensión del requerimiento
    if (amount > 1000) {
      // El monto se descuenta del disponible (no puede gastarlo de nuevo),
      // pero se mantiene en el saldo contable hasta que el admin lo apruebe.
      return { status: TransactionStatus.PENDING, data: data };
    }

    // Si no requiere revisión, se descuenta de ambos saldos
    data.accountingBalance = data.accountingBalance - amount;
    return { status: TransactionStatus.COMPLETED, data: data };
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
      data.accountingBalance = data.accountingBalance + amount;
    } else if (status === TransactionStatus.PENDING) {
      data.accountingBalance = data.accountingBalance + amount;
    }
    return data;
  }

  /**
   * Método que usaría un administrador para aprobar una transacción retenida.
   * (Opcional, pero demuestra visión a futuro).
   */
  private approveRetainedCredit(amount: number, item: WalletResponseDTO): WalletResponseDTO {
    // Al aprobar, el dinero finalmente pasa a estar disponible para el receptor
    item.availableBalance += amount;
    return item;
  }

}