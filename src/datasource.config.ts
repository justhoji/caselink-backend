/**
 * Standalone TypeORM DataSource used exclusively by the TypeORM CLI
 * (migration:generate, migration:run, migration:revert, migration:show).
 *
 * This file is intentionally separate from the NestJS AppModule so the CLI
 * can connect to the database without bootstrapping the entire Nest app.
 *
 * Usage (via npm scripts):
 *   npm run migration:generate -- src/migrations/CreateInitialSchema
 *   npm run migration:run
 *   npm run migration:revert
 *   npm run migration:show
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env so CLI commands pick up DB credentials without the NestJS config module
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'caselink_db',

  // Always disabled here — migrations manage the schema explicitly
  synchronize: false,

  // Point at compiled JS output so the CLI works after `npm run build`
  entities: [join(__dirname, '**/*.entity.js')],
  migrations: [join(__dirname, 'migrations/*.js')],

  // Keep migrations table name explicit and consistent
  migrationsTableName: 'typeorm_migrations',
});
