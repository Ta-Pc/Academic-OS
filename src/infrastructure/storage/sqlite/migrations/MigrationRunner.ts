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
    const modules = import.meta.glob('/src/infrastructure/storage/sqlite/migrations/!(*_template|MigrationRunner|Migration).ts');

    // Get the paths and sort them
    const paths = Object.keys(modules).sort();

    for (const path of paths) {
      const filename = path.split('/').pop() || '';
      const version = filename.split('_')[0];
      const module = await modules[path]();
      const migrationInstance = (module as any).default as Migration;
      this.migrations.push({ version, migration: migrationInstance });
    }
  }
}
