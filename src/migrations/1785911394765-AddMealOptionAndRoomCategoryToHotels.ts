import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMealOptionAndRoomCategoryToHotels1785911394765 implements MigrationInterface {
  name = 'AddMealOptionAndRoomCategoryToHotels1785911394765';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."package_hotels_meal_option_enum" AS ENUM('BED_AND_BREAKFAST', 'HALF_BOARD', 'FULL_BOARD', 'ALL_INCLUSIVE', 'ULTRA_ALL_INCLUSIVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" ADD "meal_option" "public"."package_hotels_meal_option_enum" NOT NULL DEFAULT 'ALL_INCLUSIVE'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."package_hotels_room_category_enum" AS ENUM('STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE', 'APARTMENT')`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" ADD "room_category" "public"."package_hotels_room_category_enum" NOT NULL DEFAULT 'STANDARD'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package_hotels" DROP COLUMN "room_category"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."package_hotels_room_category_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package_hotels" DROP COLUMN "meal_option"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."package_hotels_meal_option_enum"`,
    );
  }
}
