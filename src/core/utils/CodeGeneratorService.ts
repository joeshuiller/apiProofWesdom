import { EntityTarget, ObjectLiteral } from 'typeorm';
import { injectable } from 'inversify';
import { AppDataSource } from '@infra/database/dataSource';

@injectable()
export class CodeGeneratorService {
    private getRepository(entity: any) {
        return AppDataSource.getRepository(entity);
    }
    /**
     * Genera el siguiente código secuencial consultando únicamente el último registro insertado
     * en la base de datos para evitar recorrer toda la tabla o usar bucles de reintento.
     * * @param model La clase de la Entidad de TypeORM (ej: TicketEntity o Viaje)
     * @param columnName El nombre de la columna donde se almacena el código (ej: 'ticketCode')
     * @param orderColumn La columna de ordenación para identificar el último registro (ej: 'id' o 'createdAt')
     * @param prefix Prefijo del código (ej: 'TKT', 'PLA')
     * @param padding Cantidad de caracteres numéricos para el consecutivo (por defecto 6 -> '000001')
     * @returns Siguiente código secuencial único (ej: 'TKT-2026-000125')
     */
    public async generateNextSequentialCode<T extends ObjectLiteral>(
        model: EntityTarget<T>,
        columnName: string,
        orderColumn: string = 'id',
        prefix: string,
        padding: number = 6
    ): Promise<string> {
        const repository = this.getRepository(model);
        const currentYear = new Date().getFullYear();

        // 1. Consultar únicamente el último registro ordenado por el ID o la fecha de creación de forma descendente
        const lastRecord = await repository.createQueryBuilder('entity')
            .select(`entity.${columnName}`)
            .orderBy(`entity.${orderColumn}`, 'DESC')
            .limit(1)
            .getOne();

        let nextValue = 1;

        if (lastRecord) {
            const lastCode = (lastRecord as any)[columnName] as string;

            // 2. Validar si el código del último registro pertenece al año actual
            if (lastCode && lastCode.includes(`-${currentYear}-`)) {
                // Extraer el número consecutivo final usando expresiones regulares (captura los dígitos al final del string)
                const match = lastCode.match(/\d+$/);
                if (match) {
                    const lastNum = parseInt(match[0], 10);
                    nextValue = lastNum + 1; // Incrementamos secuencialmente
                }
            }
            // Si el año cambió (ej: el último tiquete era del 2025 y ahora estamos en 2026),
            // nextValue se mantiene en 1 para reiniciar el consecutivo anual de forma limpia.
        }

        // 3. Formatear el número incrementado con ceros a la izquierda
        const serializedNumber = String(nextValue).padStart(padding, '0');

        // Formato resultante de alta legibilidad: PREFIX-AÑO-CONSECUTIVO (ej: "TKT-2026-000001")
        return `${prefix}-${currentYear}-${serializedNumber}`;
    }

    /**
     * Genera un código alfanumérico corto único (ej: 36X8K) consultando únicamente
     * si el candidato generado de forma aleatoria colisiona con algún registro existente.
     * * @param model Entidad de TypeORM objetivo
     * @param columnName Columna donde se almacena el código
     * @param length Longitud del string alfanumérico aleatorio
     */
    public async generateUniqueAlphanumericCode<T extends ObjectLiteral>(
        model: EntityTarget<T>,
        columnName: string,
        length: number = 8
    ): Promise<string> {
        const repository = this.getRepository(model);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let isDuplicate = true;
        let generatedCode = '';
        let attempts = 0;
        const maxAttempts = 50;

        while (isDuplicate && attempts < maxAttempts) {
            attempts++;
            generatedCode = '';
            for (let i = 0; i < length; i++) {
                generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // Consulta de existencia ultra-rápida limitada a 1 coincidencia
            const count = await repository.createQueryBuilder('entity')
                .where(`entity.${columnName} = :code`, { code: generatedCode })
                .getCount();

            if (count === 0) {
                isDuplicate = false;
            }
        }

        if (isDuplicate) {
            throw new Error(
                `Fallo crítico: No se pudo generar un código alfanumérico único en la columna '${columnName}' tras ${maxAttempts} intentos.`
            );
        }

        return generatedCode;
    }
}