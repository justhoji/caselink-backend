import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncTimestamptzColumns1785910953840 implements MigrationInterface {
  name = 'SyncTimestamptzColumns1785910953840';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "airports" ALTER COLUMN "created_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "airports" ALTER COLUMN "updated_at" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "otps" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "otps" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "otps" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_media" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_media" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_media" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_media" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_packages" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_packages" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_packages" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_packages" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_extras" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_extras" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_extras" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_extras" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_extras" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_extras" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_extras" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_extras" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_packages" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_packages" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_packages" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_packages" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_flights" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_media" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_media" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_media" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_media" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" DROP COLUMN "updated_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" DROP COLUMN "created_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "otps" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "airports" ALTER COLUMN "updated_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "airports" ALTER COLUMN "created_at" DROP NOT NULL`,
    );
  }
}
