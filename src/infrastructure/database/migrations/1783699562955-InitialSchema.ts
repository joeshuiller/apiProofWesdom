import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783699562955 implements MigrationInterface {
    name = 'InitialSchema1783699562955'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_84bbe6e6fb705b8b6f4c125f94f"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_84bbe6e6fb705b8b6f4c125f94f" FOREIGN KEY ("rolesIdId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_84bbe6e6fb705b8b6f4c125f94f"`);
        await queryRunner.query(`ALTER TABLE "roles" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_84bbe6e6fb705b8b6f4c125f94f" FOREIGN KEY ("rolesIdId") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
