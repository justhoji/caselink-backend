import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAirportsAndAgencySectionsSchema1785845100000 implements MigrationInterface {
  name = 'UpdateAirportsAndAgencySectionsSchema1785845100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Update agency_page_sections_section_key_enum
    await queryRunner.query(
      `ALTER TYPE "public"."agency_page_sections_section_key_enum" RENAME TO "agency_page_sections_section_key_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."agency_page_sections_section_key_enum" AS ENUM('MEDIA', 'BASIC_INFO', 'CONTACT', 'ADDRESS', 'WORKING_HOURS', 'SOCIAL_MEDIA', 'REVIEWS', 'PACKAGES')`,
    );
    await queryRunner.query(
      `ALTER TABLE "agency_page_sections" ALTER COLUMN "section_key" TYPE "public"."agency_page_sections_section_key_enum" USING "section_key"::"text"::"public"."agency_page_sections_section_key_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."agency_page_sections_section_key_enum_old"`,
    );

    // 2. Add agency profile columns
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "facebook" VARCHAR;`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "instagram" VARCHAR;`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "youtube" VARCHAR;`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "is_reviews_enabled" BOOLEAN DEFAULT true;`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" ADD COLUMN IF NOT EXISTS "packages_sort_by" VARCHAR DEFAULT 'POPULARITY';`,
    );

    // 3. Airports table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "airports" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "icao" character varying NOT NULL,
        "iata" character varying,
        "name" character varying NOT NULL,
        "city" character varying,
        "state" character varying,
        "country" character varying,
        "lat" DECIMAL(10,7),
        "lon" DECIMAL(10,7),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_airports_icao_key" UNIQUE ("icao")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_airports_icao" ON "airports" ("icao");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_airports_iata" ON "airports" ("iata");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_airports_city" ON "airports" ("city");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "agencies" DROP COLUMN IF EXISTS "packages_sort_by";`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" DROP COLUMN IF EXISTS "is_reviews_enabled";`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" DROP COLUMN IF EXISTS "youtube";`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" DROP COLUMN IF EXISTS "instagram";`,
    );
    await queryRunner.query(
      `ALTER TABLE "agencies" DROP COLUMN IF EXISTS "facebook";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "airports";`);
  }
}
