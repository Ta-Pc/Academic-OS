import { SQLiteManager } from '../SQLiteManager';
import { Migration } from './Migration';

import schemaSQL from '/src/infrastructure/storage/sqlite/schema/schema-v1.sql?raw';

export class InitialMigration implements Migration {
  private sqliteManager: SQLiteManager;

  constructor() {
    this.sqliteManager = SQLiteManager.getInstance();
  }

  public async up(): Promise<void> {
    // Split the schema into individual statements and execute them
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      this.sqliteManager.execute(statement);
    }
  }

  public async down(): Promise<void> {
    const tables = [
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

    for (const table of tables) {
      this.sqliteManager.execute(`DROP TABLE IF EXISTS ${table}`);
    }
  }
}

export default new InitialMigration();
