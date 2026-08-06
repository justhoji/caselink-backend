import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSectionsOrderToTourPackages1785935000000 implements MigrationInterface {
  name = 'AddSectionsOrderToTourPackages1785935000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tour_packages" ADD "sections_order" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tour_packages" DROP COLUMN "sections_order"`,
    );
  }
}
