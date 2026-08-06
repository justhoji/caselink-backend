import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlightClassToPackageFlights1785930000000 implements MigrationInterface {
  name = 'AddFlightClassToPackageFlights1785930000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."package_flights_flight_class_enum" AS ENUM('ECONOMY', 'BUSINESS', 'FIRST')`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "flight_class" "public"."package_flights_flight_class_enum" NOT NULL DEFAULT 'ECONOMY'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "flight_class"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."package_flights_flight_class_enum"`,
    );
  }
}
