import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { DatabaseError } from '../../../shared/errors/DatabaseError';

export class SQLiteManager {
  private static instance: SQLiteManager;
  private sqlJs: SqlJsStatic | null = null;
  private db: Database | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SQLiteManager {
    if (!SQLiteManager.instance) {
      SQLiteManager.instance = new SQLiteManager();
    }
    return SQLiteManager.instance;
  }

  private isDbLoaded = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.isDbLoaded) return;

    try {
      if (!this.isInitialized) {
        this.sqlJs = await initSqlJs({
          locateFile: file => `node_modules/sql.js/dist/${file}`
        });
        this.isInitialized = true;
      }

      if (!this.isDbLoaded) {
        // Check if localStorage is available (for browser environment)
        if (typeof localStorage !== 'undefined') {
          const savedDb = localStorage.getItem('academic_os_db');
          if (savedDb) {
            const buffer = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
            this.db = new this.sqlJs!.Database(buffer);
          } else {
            this.db = new this.sqlJs!.Database();
          }
        } else {
          // In test environment or when localStorage is not available, create empty database
          this.db = new this.sqlJs!.Database();
        }
        this.isDbLoaded = true;
      }
    } catch (error) {
      throw new DatabaseError('Failed to initialize and load database', error as Error);
    }
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  public exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  public query(sql: string, params: any[] = []): any[] {
    if (!this.db) {
      throw new DatabaseError('Database not loaded');
    }

    // ADD THIS LINE FOR DEBUGGING:
    console.log('[SQLiteManager] Executing Query:', sql, 'WITH PARAMS:', params);

    try {
      const stmt = this.db.prepare(sql);
      const results: any[] = [];

      if (params.length > 0) {
        stmt.bind(params);
      }

      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }

      stmt.free();
      return results;
    } catch (error) {
      throw new DatabaseError(`Query execution failed: ${sql}`, error as Error);
    }
  }

  public execute(sql: string, params: any[] = []): void {
    if (!this.db) {
      throw new DatabaseError('Database not loaded');
    }

    try {
      const stmt = this.db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      stmt.step();
      stmt.free();
    } catch (error) {
      throw new DatabaseError(`Execute failed: ${sql}`, error as Error);
    }
  }

  public beginTransaction(): void {
    this.execute('BEGIN TRANSACTION');
  }

  public commit(): void {
    this.execute('COMMIT');
  }

  public rollback(): void {
    this.execute('ROLLBACK');
  }
}
