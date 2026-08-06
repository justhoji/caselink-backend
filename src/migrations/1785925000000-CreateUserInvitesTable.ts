import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserInvitesTable1785925000000 implements MigrationInterface {
  name = 'CreateUserInvitesTable1785925000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_invites_role_enum" AS ENUM('OWNER', 'MANAGER', 'COORDINATOR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_invites_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "agency_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "role" "public"."user_invites_role_enum" NOT NULL,
        "token" character varying NOT NULL,
        "status" "public"."user_invites_status_enum" NOT NULL DEFAULT 'PENDING',
        "invited_by_user_id" uuid,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_invites" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_invites_token" UNIQUE ("token"),
        CONSTRAINT "FK_user_invites_agency" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_invites_invited_by" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_invites_agency_id" ON "user_invites" ("agency_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_invites_email" ON "user_invites" ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_user_invites_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_user_invites_agency_id"`);
    await queryRunner.query(`DROP TABLE "user_invites"`);
    await queryRunner.query(`DROP TYPE "public"."user_invites_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_invites_role_enum"`);
  }
}
