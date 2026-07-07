import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as Entities from "@domain/entities";
import path from "path";
import { configEnv } from "@infra/config/env";

/**
 * Flags de entorno extraídos de la configuración validada
 */
const isTest = configEnv.NODE_ENV === "test";
const isDev = configEnv.NODE_ENV === "development";

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres", // 🔄 Cambiado a postgres
    host: configEnv.DB.HOST,
    port: configEnv.DB.PORT,
    username: configEnv.DB.USERNAME,
    password: configEnv.DB.PASSWORD,
    database: configEnv.DB.NAME,

    // 🛡️ Seguridad y Sincronización
    synchronize: isTest,

    // 📊 Logging basado en entorno
    logging: isDev ? ["query", "error", "warn"] : ["error"],

    // 🚀 Configuración del Pool (Driver 'pg')
    extra: {
        max: 50, // 🔄 En Postgres, 'connectionLimit' se reemplaza por 'max' para definir el tamaño del pool

        // Postgres maneja el keep-alive automáticamente de forma diferente a MySQL,
        // pero puedes forzar el idle timeout si es necesario:
        idleTimeoutMillis: 10000,
    },

    // 🧩 Entidades cargadas explícitamente desde el index de dominio
    entities: Object.values(Entities),

    // 📂 Migraciones (Ruta relativa al directorio actual)
    migrations: [
        path.join(__dirname, "../database/migrations/*{.ts,.js}")
    ],
};

export const AppDataSource = new DataSource(dataSourceOptions);