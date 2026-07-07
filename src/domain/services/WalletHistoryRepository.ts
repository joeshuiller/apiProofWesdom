import { AppDataSource } from "../../infrastructure/database/dataSource";
import { injectable } from "inversify";
import { IWalletHistoryRepository } from "@domain/repositories/IWalletHistoryRepository";
import { WalletHistoryEntity } from "@domain/entities/WalletHistoryEntity";
import { WalletHistoryMapperService } from "./mappers/WalletHistoryMapperService";
import { WalletHistoryResponseDTO } from "@app/dtos/response/WalletHistoryResponseDTO";
import { WalletHistoryRequestDTO } from "@app/dtos/request/WalletHistoryRequestDTO";

@injectable()
export class WalletHistoryRepository implements IWalletHistoryRepository {
    private WalletHistoryMapper: WalletHistoryMapperService;

    constructor() {
        this.WalletHistoryMapper = new WalletHistoryMapperService();
    }

    async save(wallet: WalletHistoryRequestDTO): Promise<WalletHistoryResponseDTO | null> {
        const data = await this.repository.save(this.WalletHistoryMapper.toEntity(wallet));
        return this.WalletHistoryMapper.toUpdateEntity(data);
    }

    // 👇 1. LA MEJORA PRINCIPAL (El Patrón Getter) 👇
    // Retrasamos la obtención del repositorio hasta el momento exacto de la consulta.
    // Esto evita el error de "No metadata for WalletHistoryEntity was found".
    private get repository() {
        return AppDataSource.getRepository(WalletHistoryEntity);
    }

    async findById(id: string): Promise<WalletHistoryResponseDTO | null> {
        const user = await this.repository.findOne({
            where: { id: id }, // El filtro va dentro de 'where'
            relations: ['senderId', 'receiverId'] // 👈 Agrega aquí las relaciones que necesites
        });
        return user ? this.WalletHistoryMapper.toUpdateEntity(user) : null;
    }

    async findBysenderId(senderId: string): Promise<WalletHistoryResponseDTO | null> {
        const user = await this.repository.findOne({
            where: { senderId: { id: senderId } }, // El filtro va dentro de 'where'
            relations: ['senderId', 'receiverId'] // 👈 Agrega aquí las relaciones que necesites
        });
        return user ? this.WalletHistoryMapper.toUpdateEntity(user) : null;
    }

    async findByReceiverId(receiverId: string): Promise<WalletHistoryResponseDTO | null> {
        const user = await this.repository.findOne({
            where: { receiverId: { id: receiverId } }, // El filtro va dentro de 'where'
            relations: ['receiverId'] // 👈 Agrega aquí las relaciones que necesites
        });
        return user ? this.WalletHistoryMapper.toUpdateEntity(user) : null;
    }

    async findAll(): Promise<WalletHistoryResponseDTO[] | null> {
        const WalletHistory = await this.repository.find();

        if (!WalletHistory || WalletHistory.length === 0) {
            return null;
        }
        return WalletHistory.map((dto) => this.WalletHistoryMapper.toUpdateEntity(dto));
    }
}