import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlToPackageHotels1785940000000 implements MigrationInterface {
  name = 'AddImageUrlToPackageHotels1785940000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_hotels" ADD "image_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_hotels" DROP COLUMN "image_url"`,
    );
  }
}
