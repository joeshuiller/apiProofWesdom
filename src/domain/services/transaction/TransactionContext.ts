import { AsyncLocalStorage } from 'async_hooks';
import { EntityManager } from 'typeorm';
import { injectable } from 'inversify';

@injectable()
export class TransactionContext {
    // Almacenamiento seguro para el ciclo de vida de la ejecución asíncrona
    private static storage = new AsyncLocalStorage<EntityManager>();

    // Ejecuta cualquier función dentro del aislamiento del manager de TypeORM
    public runInContext(manager: EntityManager, fn: () => Promise<any>): Promise<any> {
        return TransactionContext.storage.run(manager, fn);
    }

    // Recupera el manager de la transacción actual si existe
    public getEntityManager(): EntityManager | undefined {
        return TransactionContext.storage.getStore();
    }
}