import { AppDataSource } from "../../infrastructure/database/dataSource";
import { injectable } from "inversify";
import { IWalletRepository } from "@domain/repositories/IWalletRepository";
import { WalletResponseDTO } from "@app/dtos/response/WalletResponseDTO";
import { WalletEntity } from "@domain/entities";
import { WalletRequestDTO } from "@app/dtos/request/WalletRequestDTO";
import { EntityManager } from "typeorm";
import { WalletMapperService } from "./mappers/WalletMapperService";

@injectable()
export class WalletRepository implements IWalletRepository {
    private WalletMapper: WalletMapperService;

    constructor() {
        this.WalletMapper = new WalletMapperService();
    }

    async save(wallet: WalletRequestDTO): Promise<WalletResponseDTO | null> {
        const walletSaved = await this.repository.save(this.WalletMapper.toEntity(wallet));
        return walletSaved ? this.WalletMapper.toUpdateEntity(walletSaved) : null;
    }

    // 👇 1. LA MEJORA PRINCIPAL (El Patrón Getter) 👇
    // Retrasamos la obtención del repositorio hasta el momento exacto de la consulta.
    // Esto evita el error de "No metadata for WalletEntity was found".
    private get repository() {
        return AppDataSource.getRepository(WalletEntity);
    }

    async findById(id: string): Promise<WalletResponseDTO | null> {
        const user = await this.repository.findOne({
            where: { id: id }, // El filtro va dentro de 'where'
            relations: ['rolesId'] // 👈 Agrega aquí las relaciones que necesites
        });
        return user ? this.WalletMapper.toUpdateEntity(user) : null;
    }

    async findByUserId(userId: string): Promise<WalletResponseDTO | null> {
        const user = await this.repository.findOne({
            where: { usersId: { id: userId } }, // El filtro va dentro de 'where'
            relations: ['usersId'] // 👈 Agrega aquí las relaciones que necesites
        });
        return user ? this.WalletMapper.toUpdateEntity(user) : null;
    }

    async saveMultiple(wallets: WalletRequestDTO[], txManager?: EntityManager): Promise<void> {
        const manager = txManager || this.repository.manager;
        const ormWallets = wallets.map(w => {
            return this.WalletMapper.toEntity(w);
        });
        await manager.save(WalletEntity, ormWallets);
    }

    async findAll(): Promise<WalletResponseDTO[] | null> {
        const Wallet = await this.repository.find();

        if (!Wallet || Wallet.length === 0) {
            return null;
        }
        return Wallet.map((dto) => this.WalletMapper.toUpdateEntity(dto));
    }
}