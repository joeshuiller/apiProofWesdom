import { AppDataSource } from "../../infrastructure/database/dataSource";
import { injectable, inject } from "inversify";
import { IWalletHistoryRepository } from "@domain/repositories/IWalletHistoryRepository";
import { WalletHistoryEntity } from "@domain/entities/WalletHistoryEntity";
import { WalletHistoryMapperService } from "./mappers/WalletHistoryMapperService";
import { WalletHistoryResponseDTO } from "@app/dtos/response/WalletHistoryResponseDTO";
import { WalletHistoryRequestDTO } from "@app/dtos/request/WalletHistoryRequestDTO";
import { BaseRepository } from "./BaseRepository";
import { TYPES } from "@app/dtos/models/types";
import { TransactionContext } from "./transaction/TransactionContext";
import { DataSource } from "typeorm";
import { WalletRequestDTO } from "@app/dtos/request/WalletRequestDTO";

@injectable()
export class WalletHistoryRepository extends BaseRepository<WalletHistoryEntity> implements IWalletHistoryRepository {
    private WalletHistoryMapper: WalletHistoryMapperService;

    constructor(
        @inject(TYPES.TransactionContext) txContext: TransactionContext,
        @inject(TYPES.DataSource) dataSource: DataSource
    ) {
        super(WalletHistoryEntity, txContext, dataSource);
        this.WalletHistoryMapper = new WalletHistoryMapperService();
    }
    async update(wallet: WalletHistoryRequestDTO, id: string): Promise<WalletHistoryResponseDTO | null> {
        await this.currentRepository.update(id, this.WalletHistoryMapper.toEntity(wallet));
        return this.findById(id);
    }

    async save(wallet: WalletHistoryRequestDTO): Promise<WalletHistoryResponseDTO | null> {
        const data = await this.currentRepository.save(this.WalletHistoryMapper.toEntity(wallet));
        return this.WalletHistoryMapper.toUpdateEntity(data);
    }

    async findById(id: string): Promise<WalletHistoryResponseDTO | null> {
        const user = await this.currentRepository.findOne({
            where: { id: id }, // El filtro va dentro de 'where'
            relations: ['senderId', 'receiverId'] // 👈 Agrega aquí las relaciones que necesites
        });
        return user ? this.WalletHistoryMapper.toUpdateEntity(user) : null;
    }

    async findBysenderId(senderId: string): Promise<WalletHistoryResponseDTO | null> {
        const user = await this.currentRepository.findOne({
            where: { senderId: { id: senderId } }, // El filtro va dentro de 'where'
            relations: ['senderId', 'receiverId'] // 👈 Agrega aquí las relaciones que necesites
        });
        return user ? this.WalletHistoryMapper.toUpdateEntity(user) : null;
    }

    async findByReceiverId(receiverId: string): Promise<WalletHistoryResponseDTO | null> {
        const user = await this.currentRepository.findOne({
            where: { receiverId: { id: receiverId } }, // El filtro va dentro de 'where'
            relations: ['receiverId'] // 👈 Agrega aquí las relaciones que necesites
        });
        return user ? this.WalletHistoryMapper.toUpdateEntity(user) : null;
    }

    async findAll(): Promise<WalletHistoryResponseDTO[] | null> {
        const WalletHistory = await this.currentRepository.find({
            relations: ['senderId', 'receiverId']
        });

        if (!WalletHistory || WalletHistory.length === 0) {
            return null;
        }
        return WalletHistory.map((dto) => this.WalletHistoryMapper.toUpdateEntity(dto));
    }
}