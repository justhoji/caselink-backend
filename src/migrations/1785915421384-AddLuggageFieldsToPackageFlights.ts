import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLuggageFieldsToPackageFlights1785915421384 implements MigrationInterface {
  name = 'AddLuggageFieldsToPackageFlights1785915421384';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "is_luggage_included" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "luggage_allowance" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "departure_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "departure_time" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "arrival_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "arrival_time" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "arrival_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "arrival_time" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "departure_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "departure_time" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "luggage_allowance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "is_luggage_included"`,
    );
  }
}
