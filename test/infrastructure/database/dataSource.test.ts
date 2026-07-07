// 1. MOCK DE VARIABLES DE ENTORNO (Debe ser lo primero)
jest.mock("@infra/config/env", () => ({
    configEnv: {
        DB: {
            HOST: "localhost",
            PORT: 3306,
            NAME: "test_db",
            USERNAME: "root",
            PASSWORD: "password"
        },
        NODE_ENV: "test"
    }
}));

// 2. MOCK COMPLETO DE TYPEORM
jest.mock("typeorm", () => {
    const decorator = () => () => { };
    return {
        DataSource: jest.fn().mockImplementation(() => ({
            initialize: jest.fn(),
            destroy: jest.fn(),
        })),
        Entity: decorator,
        PrimaryGeneratedColumn: decorator,
        Column: decorator,
        CreateDateColumn: decorator,
        UpdateDateColumn: decorator,
        DeleteDateColumn: decorator,
        ManyToOne: decorator,
        OneToMany: decorator,
        JoinColumn: decorator,
    };
});

// 3. IMPORTS
import { DataSource } from "typeorm";
import { AppDataSource, dataSourceOptions } from "@infra/database/dataSource";
import { configEnv } from "@infra/config/env";
import { MysqlConnectionOptions } from "typeorm/driver/mysql/MysqlConnectionOptions";

describe("Database Configuration (DataSource)", () => {
    // Cast para validar propiedades de MySQL
    const options = dataSourceOptions as MysqlConnectionOptions;

    it("should initialize the DataSource with the correct driver", () => {
        expect(AppDataSource).toBeDefined();
        expect(DataSource).toHaveBeenCalled();
    });

    describe("Mapping de Credenciales", () => {
        it("should match the configuration from configEnv", () => {
            expect(options.type).toBe("mysql");
            expect(options.host).toBe(configEnv.DB.HOST);
            expect(options.port).toBe(configEnv.DB.PORT);
            expect(options.database).toBe(configEnv.DB.NAME);
            expect(options.username).toBe(configEnv.DB.USERNAME);
        });
    });

    describe("Configuraciones de Entorno", () => {
        it("should synchronize only in test environment", () => {
            // Validamos contra nuestro mock de arriba
            expect(options.synchronize).toBe(true);
        });

        it("should have logging defined", () => {
            expect(options.logging).toBeDefined();
        });

        it("should have UTC timezone (Z) configured", () => {
            expect(options.timezone).toBe("Z");
        });
    });

    describe("Connection Pool (Extra)", () => {
        it("should have performance options (KeepAlive, Limit)", () => {
            const extra = options.extra as any;
            expect(extra.connectionLimit).toBe(50);
            expect(extra.enableKeepAlive).toBe(true);
        });
    });

    it("should verify that the entities array is not empty", () => {
        expect(Array.isArray(options.entities)).toBe(true);
        // Esto confirma que se cargaron las entidades del dominio
        expect(options.entities?.length).toBeGreaterThan(0);
    });
});