import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783626058237 implements MigrationInterface {
    name = 'InitialSchema1783626058237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "wallets_history" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_e67cd87f3fb0d6fba98a80f5d3f"`);
        await queryRunner.query(`ALTER TABLE "wallets_history" DROP CONSTRAINT "FK_98201c1077572a0b1d97bcad187"`);
        await queryRunner.query(`ALTER TABLE "wallets_history" DROP CONSTRAINT "FK_5434f738e451ef0f8a25acfa137"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_e67cd87f3fb0d6fba98a80f5d3f" FOREIGN KEY ("usersIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets_history" ADD CONSTRAINT "FK_98201c1077572a0b1d97bcad187" FOREIGN KEY ("senderIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets_history" ADD CONSTRAINT "FK_5434f738e451ef0f8a25acfa137" FOREIGN KEY ("receiverIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets_history" DROP CONSTRAINT "FK_5434f738e451ef0f8a25acfa137"`);
        await queryRunner.query(`ALTER TABLE "wallets_history" DROP CONSTRAINT "FK_98201c1077572a0b1d97bcad187"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_e67cd87f3fb0d6fba98a80f5d3f"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallets_history" ADD CONSTRAINT "FK_5434f738e451ef0f8a25acfa137" FOREIGN KEY ("receiverIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets_history" ADD CONSTRAINT "FK_98201c1077572a0b1d97bcad187" FOREIGN KEY ("senderIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_e67cd87f3fb0d6fba98a80f5d3f" FOREIGN KEY ("usersIdId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wallets_history" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "id" DROP DEFAULT`);
    }

}
