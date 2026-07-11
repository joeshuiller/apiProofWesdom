import { injectable, inject } from "inversify";
import { DataSource } from "typeorm";
import { TYPES } from "@app/dtos/models/types";
import { TransactionContext } from "./TransactionContext";

@injectable()
export class UnitOfWork {
    constructor(
        @inject(TYPES.DataSource) private readonly dataSource: DataSource,
        @inject(TYPES.TransactionContext) private readonly txContext: TransactionContext
    ) { }

    async execute<T>(work: () => Promise<T>): Promise<T> {
        return await this.dataSource.transaction(async (entityManager) => {
            return await this.txContext.runInContext(entityManager, work);
        });
    }
}