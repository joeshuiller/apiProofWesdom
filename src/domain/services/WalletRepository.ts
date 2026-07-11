import { injectable, inject } from "inversify";
import { DataSource } from "typeorm";
import { IWalletRepository } from "@domain/repositories/IWalletRepository";
import { WalletResponseDTO } from "@app/dtos/response/WalletResponseDTO";
import { WalletEntity } from "@domain/entities";
import { WalletRequestDTO } from "@app/dtos/request/WalletRequestDTO";
import { WalletMapperService } from "./mappers/WalletMapperService";
import { BaseRepository } from "./BaseRepository";
import { TYPES } from "@app/dtos/models/types";
import { TransactionContext } from "./transaction/TransactionContext";

@injectable()
export class WalletRepository extends BaseRepository<WalletEntity> implements IWalletRepository {
    private WalletMapper: WalletMapperService;

    constructor(
        @inject(TYPES.TransactionContext) txContext: TransactionContext,
        @inject(TYPES.DataSource) dataSource: DataSource
    ) {
        super(WalletEntity, txContext, dataSource);
        this.WalletMapper = new WalletMapperService();
    }

    // =========================================================================
    // 🟢 LECTURAS COMUNES (Rápidas, Seguras y sin bloquear la BD)
    // =========================================================================

    async findById(id: string): Promise<WalletResponseDTO | null> {
        const wallet = await this.currentRepository.findOne({
            where: { id: id },
            relations: ['usersId']
            // 🌟 Sin lock: perfecto para dashboards y queries del día a día
        });
        return wallet ? this.WalletMapper.toUpdateEntity(wallet) : null;
    }

    async findByUserId(userId: string): Promise<WalletResponseDTO | null> {
        const wallet = await this.currentRepository.findOne({
            where: { usersId: { id: userId } },
            relations: ['usersId']
            // 🌟 Sin lock
        });
        return wallet ? this.WalletMapper.toUpdateEntity(wallet) : null;
    }

    async findAll(): Promise<WalletResponseDTO[] | null> {
        const wallets = await this.currentRepository.find({
            relations: ['usersId']
        });

        if (!wallets || wallets.length === 0) {
            return null;
        }
        return wallets.map((entity) => this.WalletMapper.toUpdateEntity(entity));
    }

    // =========================================================================
    // 🛡️ LECTURAS CON BLOQUEO (Exclusivas para transacciones dentro del UnitOfWork)
    // =========================================================================

    async findByIdForUpdate(id: string): Promise<WalletResponseDTO | null> {
        const wallet = await this.currentRepository.findOne({
            where: { id: id },
            relations: ['usersId'],
            lock: { mode: 'pessimistic_write' } // 🔒 Bloquea concurrentes (Exige transacción)
        });
        return wallet ? this.WalletMapper.toUpdateEntity(wallet) : null;
    }

    async findByUserIdForUpdate(userId: string): Promise<WalletResponseDTO | null> {
        const wallet = await this.currentRepository.findOne({
            where: { usersId: { id: userId } },
            relations: ['usersId'],
            lock: { mode: 'pessimistic_write' } // 🔒 Bloquea concurrentes (Exige transacción)
        });
        return wallet ? this.WalletMapper.toUpdateEntity(wallet) : null;
    }

    // =========================================================================
    // ✍️ OPERACIONES DE ESCRITURA (Automáticamente transaccionales gracias a currentRepository)
    // =========================================================================

    async update(wallet: WalletRequestDTO, id: string): Promise<WalletResponseDTO | null> {
        await this.currentRepository.update(id, this.WalletMapper.toEntity(wallet));
        return this.findById(id);
    }

    async save(wallet: WalletRequestDTO): Promise<WalletResponseDTO | null> {
        const walletSaved = await this.currentRepository.save(this.WalletMapper.toEntity(wallet));
        return walletSaved ? this.WalletMapper.toUpdateEntity(walletSaved) : null;
    }

    async saveMultiple(wallets: WalletRequestDTO[]): Promise<void> {
        // 🌟 Ya no necesitamos pasar el parametro 'txManager', currentRepository maneja el Contexto asíncrono
        const ormWallets = wallets.map(w => this.WalletMapper.toEntity(w));
        await this.currentRepository.save(ormWallets);
    }
}