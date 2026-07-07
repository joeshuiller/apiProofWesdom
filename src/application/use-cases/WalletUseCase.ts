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
import { inject, injectable } from "inversify";

@injectable()
export class WalletUseCase {
  private readonly unitOfWork: any
  constructor(
    @inject(TYPES.IWalletRepository) private walletRepository: IWalletRepository,
    @inject(TYPES.IWalletHistoryRepository) private walletHistoryRepository: IWalletHistoryRepository,
    @inject(TYPES.UtilsData) private readonly utilsData: UtilsData,
  ) {
  }

  async create(dto: TransferDTO): Promise<WalletHistoryResponseDTO | null> {
    return await this.unitOfWork.transaction(async (txContext: any) => {
      const senderWallet = await this.walletRepository.findById(dto.senderId);
      const receiverWallet = await this.walletRepository.findById(dto.receiverId);

      if (!senderWallet || !receiverWallet) {
        throw new Error("Billetera de origen o destino no encontrada");
      }

      // 1. Dominio puro: El Agregado Wallet maneja la regla de los $1000 USD
      const txStatus = this.debit(dto.amount, senderWallet);
      const newReceiverWallet = this.credit(dto.amount, txStatus.status, receiverWallet);

      // 2. Persistencia atómica
      await this.walletRepository.saveMultiple([txStatus.data, newReceiverWallet], txContext);

      // 3. Crear registro histórico
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

  async findAll(): Promise<WalletResponseDTO[] | null> {
    return await this.walletRepository.findAll();
  }

  // --- REGLAS DE NEGOCIO ---

  /**
   * Ejecuta el débito aplicando la regla de los $1,000 USD.
   * @param amount Monto a transferir
   * @returns El estado con el que debe nacer la transacción
   */
  private debit(amount: number, item: WalletResponseDTO): { status: TransactionStatus, data: WalletResponseDTO } {
    if (amount <= 0) {
      throw new Error("El monto de la transferencia debe ser mayor a cero.");
    }

    if (item.availableBalance < amount) {
      throw new Error("Saldo insuficiente."); // Este error mapeará a un HTTP 422
    }

    // Siempre bloqueamos el dinero disponible para evitar un doble gasto
    item.availableBalance -= amount;

    // Regla de Compliance: Tensión del requerimiento
    if (amount > 1000) {
      // El monto se descuenta del disponible (no puede gastarlo de nuevo),
      // pero se mantiene en el saldo contable hasta que el admin lo apruebe.
      return { status: TransactionStatus.PENDING, data: item };
    }

    // Si no requiere revisión, se descuenta de ambos saldos
    item.accountingBalance -= amount;
    return { status: TransactionStatus.COMPLETED, data: item };
  }

  /**
   * Ejecuta el crédito dependiendo del estado de la transferencia.
   * @param amount Monto a recibir
   * @param status Estado de la transacción entrante
   */
  private credit(amount: number, status: TransactionStatus, item: WalletResponseDTO): WalletResponseDTO {
    if (amount <= 0) {
      throw new Error("El monto a recibir debe ser mayor a cero.");
    }

    if (status === TransactionStatus.COMPLETED) {
      // Transferencia directa: suma a ambos saldos
      item.availableBalance += amount;
      item.accountingBalance += amount;
    } else if (status === TransactionStatus.PENDING) {
      // Experiencia de usuario (UX): 
      // Se refleja en su saldo contable (lo ve "entrando"),
      // pero NO en su saldo disponible (no puede gastarlo aún).
      item.accountingBalance += amount;
    }
    return item;
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