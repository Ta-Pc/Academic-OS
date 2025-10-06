import fs from 'fs';
import path from 'path';
import { SQLiteManager } from '../SQLiteManager';
import { Migration } from './Migration';

export class InitialMigration implements Migration {
  private sqliteManager: SQLiteManager;

  constructor() {
    this.sqliteManager = SQLiteManager.getInstance();
  }

  public async up(): Promise<void> {
    const schemaPath = path.resolve(__dirname, '../../schema/schema-v1.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    // Split the schema into individual statements and execute them
    const statements = schemaSql
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
