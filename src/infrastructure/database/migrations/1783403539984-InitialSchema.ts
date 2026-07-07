import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783403539984 implements MigrationInterface {
    name = 'InitialSchema1783403539984'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL, "availableBalance" numeric(10,2) NOT NULL DEFAULT '0', "accountingBalance" numeric(10,2) NOT NULL DEFAULT '0', "version" integer NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "usersIdId" uuid NOT NULL, CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."wallets_history_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "wallets_history" ("id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL DEFAULT '0', "status" "public"."wallets_history_status_enum" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "senderIdId" uuid NOT NULL, "receiverIdId" uuid NOT NULL, CONSTRAINT "PK_2fa3f80de4fda9b41fb4f5e05b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "name" character varying NOT NULL, "surName" character varying NOT NULL, "typeDocumentID" character varying NOT NULL DEFAULT 'CC', "documentID" character varying NOT NULL, "telephone" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "imgClients" text NOT NULL, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "rolesIdId" uuid NOT NULL, CONSTRAINT "UQ_6ac87e7e6f37de6fc3d38fc9267" UNIQUE ("documentID"), CONSTRAINT "UQ_aacbcbfc16077f6b485951adfb4" UNIQUE ("telephone"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL, "name" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_e67cd87f3fb0d6fba98a80f5d3f" FOREIGN KEY ("usersIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets_history" ADD CONSTRAINT "FK_98201c1077572a0b1d97bcad187" FOREIGN KEY ("senderIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets_history" ADD CONSTRAINT "FK_5434f738e451ef0f8a25acfa137" FOREIGN KEY ("receiverIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_84bbe6e6fb705b8b6f4c125f94f" FOREIGN KEY ("rolesIdId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_84bbe6e6fb705b8b6f4c125f94f"`);
        await queryRunner.query(`ALTER TABLE "wallets_history" DROP CONSTRAINT "FK_5434f738e451ef0f8a25acfa137"`);
        await queryRunner.query(`ALTER TABLE "wallets_history" DROP CONSTRAINT "FK_98201c1077572a0b1d97bcad187"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_e67cd87f3fb0d6fba98a80f5d3f"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "wallets_history"`);
        await queryRunner.query(`DROP TYPE "public"."wallets_history_status_enum"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
    }

}
