import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsArchivedToTourPackages1785920000000 implements MigrationInterface {
  name = 'AddIsArchivedToTourPackages1785920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tour_packages" ADD "is_archived" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tour_packages" DROP COLUMN "is_archived"`,
    );
  }
}
