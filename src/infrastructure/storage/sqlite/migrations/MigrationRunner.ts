import fs from 'fs';
import path from 'path';
import { SQLiteManager } from '../SQLiteManager';
import { TransactionManager } from '../TransactionManager';
import { Migration } from './Migration';

export class MigrationRunner {
  private sqliteManager: SQLiteManager;
  private transactionManager: TransactionManager;
  private migrations: { version: string; migration: Migration }[] = [];
  private schemaMigrationsTable = 'schema_migrations';

  constructor() {
    this.sqliteManager = SQLiteManager.getInstance();
    this.transactionManager = new TransactionManager(this.sqliteManager);
  }

  public async runMigrations(): Promise<void> {
    await this.ensureSchemaMigrationsTable();

    await this.loadMigrations();

    const appliedVersions = await this.getAppliedMigrationVersions();

    // Filter migrations that are not applied yet
    const pendingMigrations = this.migrations.filter(
      (m) => !appliedVersions.includes(m.version)
    );

    // If legacy tables exist and no migrations applied, mark initial migration as applied
    if (appliedVersions.length === 0) {
      const legacyTablesExist = await this.checkLegacyTablesExist();
      if (legacyTablesExist) {
        await this.recordMigrationApplied('001_initial');
      }
    }

    // Run pending migrations in order
    for (const { version, migration } of pendingMigrations) {
      await this.transactionManager.runInTransaction(async () => {
        await migration.up();
        await this.recordMigrationApplied(version);
      });
    }
  }

  private async ensureSchemaMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.schemaMigrationsTable} (
        version TEXT PRIMARY KEY
      );
    `;
    this.sqliteManager.execute(sql);
  }

  private async getAppliedMigrationVersions(): Promise<string[]> {
    const rows = this.sqliteManager.query(
      `SELECT version FROM ${this.schemaMigrationsTable}`
    );
    return rows.map((row) => row.version);
  }

  private async recordMigrationApplied(version: string): Promise<void> {
    this.sqliteManager.execute(
      `INSERT INTO ${this.schemaMigrationsTable} (version) VALUES (?)`,
      [version]
    );
  }

  private async checkLegacyTablesExist(): Promise<boolean> {
    const tablesToCheck = [
      'AcademicInfo',
      'Degree',
      'AcademicTerm',
      'Assessment',
      'SystemSettings',
      'Module',
      'ModuleOffering',
      'TermClosure',
      'user_dashboard_settings',
    ];

    for (const table of tablesToCheck) {
      const result = this.sqliteManager.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      );
      if (result.length === 0) {
        return false;
      }
    }
    return true;
  }

  private async loadMigrations(): Promise<void> {
    const migrationsDir = path.resolve(__dirname, './');
    const files = fs.readdirSync(migrationsDir);

    const migrationFiles = files.filter(
      (file) => file.match(/^\d+.*\.ts$/) && file !== 'MigrationRunner.ts' && file !== 'Migration.ts'
    );

    // Sort files by version prefix
    migrationFiles.sort();

    for (const file of migrationFiles) {
      const version = file.split('_')[0].replace('.ts', '');
      // Dynamically import migration
      // Note: This requires the environment to support dynamic import or use require
      // Using require here for compatibility
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const migrationModule = require(path.join(migrationsDir, file));
      const migrationInstance: Migration = migrationModule.default || migrationModule;
      this.migrations.push({ version, migration: migrationInstance });
    }
  }
}
