import { injectable, inject } from 'inversify';
import { Repository, ObjectLiteral, EntityTarget, DataSource } from 'typeorm';
import { TransactionContext } from './transaction/TransactionContext';
import { TYPES } from '@app/dtos/models/types';

@injectable()
export abstract class BaseRepository<T extends ObjectLiteral> {
    constructor(
        private readonly entityTarget: EntityTarget<T>,
        @inject(TYPES.TransactionContext) private readonly txContext: TransactionContext,
        @inject(TYPES.DataSource) private readonly dataSource: DataSource
    ) { }

    // Propiedad núcleo: Elige automáticamente el contexto de ejecución correcto
    protected get currentRepository(): Repository<T> {
        const txManager = this.txContext.getEntityManager();

        if (txManager) {
            // Si estamos dentro de un UnitOfWork, resolvemos el repositorio bindeado a la transacción
            return txManager.getRepository(this.entityTarget);
        }

        // Si no hay transacción activa, usamos el repositorio estándar fuera de la transacción
        return this.dataSource.getRepository(this.entityTarget);
    }
}