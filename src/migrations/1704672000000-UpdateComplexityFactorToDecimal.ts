import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateComplexityFactorToDecimal1704672000000 implements MigrationInterface {
    name = 'UpdateComplexityFactorToDecimal1704672000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Primero agregamos la nueva columna decimal
        await queryRunner.query(`ALTER TABLE "products" ADD "complexity_factor_new" decimal(3,1) NOT NULL DEFAULT '1.0'`);
        
        // Actualizamos los valores existentes del enum a decimal
        await queryRunner.query(`UPDATE "products" SET "complexity_factor_new" = '1.0' WHERE "complexityFactor" = '1'`);
        await queryRunner.query(`UPDATE "products" SET "complexity_factor_new" = '1.5' WHERE "complexityFactor" = '1.5'`);
        await queryRunner.query(`UPDATE "products" SET "complexity_factor_new" = '2.0' WHERE "complexityFactor" = '2'`);
        
        // Eliminamos la columna enum antigua
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "complexityFactor"`);
        
        // Renombramos la nueva columna al nombre original
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "complexity_factor_new" TO "complexityFactor"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Crear el tipo enum
        await queryRunner.query(`CREATE TYPE "public"."products_complexityfactor_enum" AS ENUM('1', '1.5', '2')`);
        
        // Agregar nueva columna enum
        await queryRunner.query(`ALTER TABLE "products" ADD "complexity_factor_enum" "public"."products_complexityfactor_enum" NOT NULL DEFAULT '1'`);
        
        // Convertir valores de decimal a enum
        await queryRunner.query(`UPDATE "products" SET "complexity_factor_enum" = '1' WHERE "complexityFactor" = '1.0'`);
        await queryRunner.query(`UPDATE "products" SET "complexity_factor_enum" = '1.5' WHERE "complexityFactor" = '1.5'`);
        await queryRunner.query(`UPDATE "products" SET "complexity_factor_enum" = '2' WHERE "complexityFactor" = '2.0'`);
        
        // Eliminar columna decimal
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "complexityFactor"`);
        
        // Renombrar columna enum
        await queryRunner.query(`ALTER TABLE "products" RENAME COLUMN "complexity_factor_enum" TO "complexityFactor"`);
    }
}
